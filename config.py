from decouple import config

# Carrega a URL do .env. Se não encontrar, usa o default.
BRASIL_API_URL = config('BRASIL_API_URL', default='https://brasilapi.com.br/api/cnpj/v1')
