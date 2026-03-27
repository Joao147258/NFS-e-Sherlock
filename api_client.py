import requests
import time
from config import BRASIL_API_URL

def buscar_dados_cnpj(cnpj: str):
    """
    Limpa o CNPJ (remove pontuação) e faz a requisição na Brasil API.
    """
    cnpj_limpo = "".join([c for c in cnpj if c.isdigit()])
    if len(cnpj_limpo) != 14:
        print(f"CNPJ {cnpj} possui tamanho inválido. Digite os 14 números.")
        return None
        
    url = f"{BRASIL_API_URL}/{cnpj_limpo}"
    
    # Adicionamos 'headers' simulando um ambiente de navegador (Chrome). 
    # Muitas APIs como a BrasilAPI bloqueiam o "python-requests" por padrão (Erro 429) por ser ferramenta de bot.
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            print(f"\n[!] Erro 429 (Too Many Requests). A API bloqueou sua tentativa temporariamente. Aguarde uns 15-30 segundos e tente o mesmo CNPJ novamente.")
            return None
        elif response.status_code == 404:
            print(f"CNPJ {cnpj} não encontrado na base de dados.")
            return None
        else:
            print(f"Erro na requisição ({response.status_code}): {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Erro de conexão com a API: {e}")
        return None
