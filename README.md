# provador-virtual-esmaltes
Aplicação Web de Realidade Aumentada para visualização virtual de esmalte

Olá, Seja Bem-vindo(a) ao meu projeto!

Eu criei esse projeto para testar minhas habilidades de desenvolvimento webAR e resolver um problema real: testar cores de esmalte sem precisar pintar a unha de verdade! 
É um provador virtual interativo que usa a câmera para simular o resultado em tempo real.
_______________________________________

#O que este projeto faz?

Captura a imagem da mão: O site pede permissão para usar a sua câmera e mostra a sua mão na tela.
Provador em tempo real: O sistema identifica as suas unhas e sobrepõe a cor do esmalte escolhido.
4 cores iniciais: Você pode testar e alternar entre quatro opções de cores (Renda, Beijo, Fúcsia e Preto).
_______________________________________

#O que eu usei para construir?

Para fazer essa mágica acontecer, eu utilizei:
HTML5: Para estruturar a página e criar a área do vídeo da câmera.
CSS3: Para deixar o visual moderno, organizar os botões de cores e criar um layout limpo.
JavaScript: Para controlar o acesso à câmera, gerenciar o clique nas cores e fazer a lógica de sobreposição na unha.

_______________________________________

#Origem dos Assets 3D (Créditos)

Modelagem Procedural: O projeto não utiliza arquivos de modelos 3D externos (como `.gltf` ou `.obj`) baixados de terceiros. 
Todas as malhas e geometrias das unhas foram desenvolvidas e otimizadas inteiramente via código utilizando a biblioteca Three.js (`THREE.SphereGeometry`), garantindo uma aplicação extremamente leve, com carregamento rápido e alta performance para dispositivos móveis.
_______________________________________

#Testes Automatizados

O projeto inclui o arquivo de testes automatizados `ui.test.js` na raiz da aplicação.

Esse script utiliza as bibliotecas Vitest e JSDOM para realizar testes de integração na interface (UI), garantindo a integridade dos seguintes pontos críticos:
1. Presença e configuração correta do elemento de vídeo (<video id="webcam">) com atributos essenciais para mobile (autoplay e playsinline).
2. Existência do elemento de renderização gráfica (<canvas id="ar-canvas">) para os overlays em 3D.
3. Validação do estado inicial da aplicação, garantindo a exibição do indicador de carregamento ("loading-overlay") e a seleção padrão do esmalte "Renda".

Esses testes asseguram que modificações futuras no HTML não quebrem a estrutura básica necessária para o funcionamento do motor de Realidade Aumentada (AREngine).
_______________________________________

#Como testar?

1. Abra o link pelo celular.
2. Autorize o site a usar a sua câmera quando o navegador pedir.
3. Coloque sua mão em frente à câmera e escolha uma cor para testar!
_______________________________________

#Quem sou eu?
Meu nome é Bruna Rafaela Garcia de Oliveira, sou aluna do curso de Realidade Aumentada pelo iRede e estudante de Sistema de Informação pela PUC-Campinas.
_______________________________________

Desenvolvido por mim para fins de aprendizado e portfólio. Fique à vontade para olhar o código!

Link do site do projeto: https://provador-de-esmalte-virtual.netlify.app


