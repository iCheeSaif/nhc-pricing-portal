"""Run: python -m pytest -q"""
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import app as pricing

@pytest.fixture
def client(tmp_path):
    pricing.DB_PATH=tmp_path/'test.sqlite3'
    pricing.init_db()
    with TestClient(pricing.app) as c:
        yield c

def as_user(c,name):
    resp=c.post('/api/auth/login',json={'username':name,'password':'Demo@2026!'})
    assert resp.status_code==200,resp.text
    return {'x-csrf-token':resp.json()['csrf']}

def create_request(c,kind,unit,project_id=1,infra=None):
    headers=as_user(c,'maker')
    r=c.post('/api/requests',headers=headers,json={'kind':kind,'project_id':project_id})
    assert r.status_code==200,r.text
    id=r.json()['id']
    r=c.post(f'/api/requests/{id}/items',headers=headers,json={'data':unit,'infra_budget_id':infra})
    assert r.status_code==200,r.text
    return id,headers

def act(c,id,name,action='approve',comment=''):
    headers=as_user(c,name)
    return c.post(f'/api/requests/{id}/action',headers=headers,json={'action':action,'comment':comment})

def fully_approve_price(c,id):
    assert act(c,id,'checker').status_code==200
    for name in ('pm','pricing','relation','developers','ops','pmo','head'):
        resp=act(c,id,name)
        assert resp.status_code==200, (name,resp.text)
    assert c.get(f'/api/requests/{id}').json()['status']=='approved'

def test_pricing_engine_rules():
    s=pricing.default_snapshot({'unit_code':'A','unit_type':'villa','status':'available','sale_area':200,'land_area':100,
       'price_method':'detailed','beneficiary_building_rate':2000,'beneficiary_infra_rate':500,'beneficiary_land_rate':1000,
       'nonbeneficiary_building_rate':2300,'nonbeneficiary_infra_rate':600,'nonbeneficiary_land_rate':1100})
    calc=pricing.calculate(s,{'project_type':'company','ministry_factor':0.2941})
    assert calc['segments']['beneficiary']['total']==550000
    assert calc['segments']['nonbeneficiary']['total']==630000
    s['infra_discount']=50001
    with pytest.raises(ValueError,match='البنية التحتية'):pricing.calculate(s,{'project_type':'company','ministry_factor':0.2941})
    s['infra_discount']=10000;s['escalation_pct']=2
    with pytest.raises(ValueError,match='التدرج'):pricing.calculate(s,{'project_type':'company','ministry_factor':0.2941})
    s['escalation_pct']=0;s['infra_discount']=0;s['inkind_discount']=100
    with pytest.raises(ValueError,match='الوزارة'):pricing.calculate(s,{'project_type':'company','ministry_factor':0.2941})

def test_full_price_approval_and_immutability(client):
    c=client
    as_user(c,'maker')
    before=c.get('/api/units?project_id=1').json()[0]
    data=dict(before['data']);data['beneficiary_building_rate']+=100
    request_id,h=create_request(c,'price',data)
    assert c.get('/api/units?project_id=1').json()[0]['pricing']==before['pricing']
    assert c.post(f'/api/requests/{request_id}/action',json={'action':'submit'}).status_code==403
    assert c.post(f'/api/requests/{request_id}/action',json={'action':'submit'},headers=h).status_code==200
    # maker cannot checker-approve
    assert c.post(f'/api/requests/{request_id}/action',headers=h,json={'action':'approve'}).status_code==403
    fully_approve_price(c,request_id)
    after=c.get('/api/units?project_id=1').json()[0]
    assert after['pricing']['segments']['beneficiary']['total']>before['pricing']['segments']['beneficiary']['total']
    assert after['version']==before['version']+1
    assert len(c.get(f'/api/units/{after["id"]}/history').json())==1
    h=as_user(c,'maker')
    assert c.post(f'/api/requests/{request_id}/items',headers=h,json={'data':data}).status_code==422

def test_budget_ledger_and_block_sold_unit(client):
    c=client
    as_user(c,'maker')
    unit=c.get('/api/units?project_id=1').json()[1]
    s=dict(unit['data']);s['infra_discount']=10000
    request_id,h=create_request(c,'price',s,infra=1)
    assert c.post(f'/api/requests/{request_id}/action',headers=h,json={'action':'submit'}).status_code==200
    fully_approve_price(c,request_id)
    budget=next(x for x in c.get('/api/budgets').json() if x['id']==1)
    assert budget['used']==10000
    assert budget['remaining']==budget['total_amount']-10000
    unit2=c.get('/api/units?project_id=1').json()[1]
    h=as_user(c,'maker')
    assert c.post(f'/api/units/{unit2["id"]}/status',headers=h,json={'status':'sold'}).status_code==200
    s=dict(unit2['data']);s['beneficiary_building_rate']+=100
    req=c.post('/api/requests',headers=h,json={'kind':'price','project_id':1}).json()['id']
    resp=c.post(f'/api/requests/{req}/items',headers=h,json={'data':s})
    assert resp.status_code==422


def test_excel_base_and_design_changes(client):
    c=client
    maker=as_user(c,'maker')
    a=c.post('/api/agreements',headers=maker,json={'contract_no':'AGR-2','developer':'المطور الثاني',
                                                     'project_name':'مشروع تجريبي'}).json()['id']
    pid=c.post('/api/projects',headers=maker,json={'code':'PRJ-002','name':'مشروع ثان','agreement_id':a,
                                                    'destination_id':1,'project_type':'company'}).json()['id']
    req=c.post('/api/requests',headers=maker,json={'project_id':pid,'kind':'base'}).json()['id']
    template=c.get('/api/templates/units.xlsx')
    assert template.status_code==200
    resp=c.post(f'/api/requests/{req}/import',headers=maker,
                files={'file':('pricing_units_template.xlsx',template.content,
                               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')})
    assert resp.status_code==200,resp.text
    assert resp.json()['imported']==2
    assert c.get(f'/api/units?project_id={pid}').json()==[]  # still unapproved
    assert c.post(f'/api/requests/{req}/action',headers=maker,json={'action':'submit'}).status_code==200
    assert act(c,req,'checker').status_code==200
    units=c.get(f'/api/units?project_id={pid}').json()
    assert len(units)==2
    old=next(u for u in units if u['data']['unit_type']=='villa')
    new=dict(old['data']);new['sale_area']+=15
    design,h=create_request(c,'design',new,pid)
    assert c.post(f'/api/requests/{design}/action',headers=h,json={'action':'submit'}).status_code==200
    assert act(c,design,'checker').status_code==200
    updated=next(u for u in c.get(f'/api/units?project_id={pid}').json() if u['id']==old['id'])
    assert updated['pricing']['segments']['beneficiary']['total']>old['pricing']['segments']['beneficiary']['total']


def test_compare_and_rbac(client):
    c=client
    assert c.get('/api/dashboard').status_code==401
    m=as_user(c,'maker')
    first=c.post('/api/requests',headers=m,json={'kind':'base','project_id':1}).json()['id']
    second=c.post('/api/requests',headers=m,json={'kind':'base','project_id':1}).json()['id']
    result=c.get(f'/api/compare?a={first}&b={second}')
    assert result.status_code==200 and result.json()['matched']
    assert c.post('/api/users',headers=m,json={'username':'foo','name':'foo','role':'checker','password':'123456789X'}).status_code==403
