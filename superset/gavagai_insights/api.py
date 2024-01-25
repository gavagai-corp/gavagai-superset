import requests
from flask import Response, request
from flask_appbuilder.api import expose
from flask_appbuilder.security.decorators import has_access
from superset import app
from superset.views.base_api import BaseSupersetApi, requires_json
from superset.constants import RouteMethod
from superset.views.base import handle_api_exception

config = app.config
GAVAGAI_API_URL = config["GAVAGAI_API_URL"]

class GavagaiInsightsRestApi(BaseSupersetApi):
    include_route_methods = {
        RouteMethod.POST,
    }
    resource_name = "gavagai"
    @expose("/insights", methods=("POST",))
    @handle_api_exception
    @has_access
    @requires_json
    def post(self) -> Response:
        jsonRequest = request.get_json()
        access_token = ''
        url = f'{GAVAGAI_API_URL}/projects/{jsonRequest.get("projectId")}'
        headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {access_token}'}
        bodyRequest = {'topic': jsonRequest.get('topic'), 'texts':jsonRequest.get('texts'), 'sentiment': jsonRequest.get('sentiment')}
        print(bodyRequest)
        
        try:
            r = requests.get(url, headers=headers)
            r.raise_for_status()
            return self.response(200, result=r.json())
        except requests.exceptions.HTTPError as err:
            return self.response_500(error=err.status, message=err.message)