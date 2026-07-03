import { AREngine } from './ar-engine.js';

const video = document.getElementById('webcam');
const canvas = document.getElementById('ar-canvas');
const loadingOverlay = document.querySelector('.loading-overlay');
const botoesCores = document.querySelectorAll('.color-card');
const botaoFechar = document.querySelector('.btn-icon[aria-label="Fechar"]');

let engine = null;
let ultimoTempoFrame = 0;
const FPS_LIMITADO = 30;
const INTERVALO_FRAME = 1000 / FPS_LIMITADO;

async function iniciarCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        });
        video.srcObject = stream;
        return new Promise((resolve) => { video.onloadedmetadata = resolve; });
    } catch (error) {
        console.error("Erro ao acessar a câmera: - app.js:23", error);
        loadingOverlay.textContent = "Erro ao acessar a câmera. Por favor, permita o acesso e recarregue a página.";
        loadingOverlay.style.color = "#ff3333";
        throw error;
    }
}

async function main() {
    engine = new AREngine(video, canvas);
    try {
        await Promise.all([iniciarCamera(), engine.initDetector()]);
        engine.initThreeJS();
        loadingOverlay.style.display = 'none';

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log("Página oculta, pausando detecção para economia de energia. - app.js:39");
            }
        });

        function loop(tempoAtual) {
            requestAnimationFrame(loop);

            const tempoDecorrido = tempoAtual - ultimoTempoFrame;
            if (tempoDecorrido >= INTERVALO_FRAME) {
                ultimoTempoFrame = tempoAtual - (tempoDecorrido % INTERVALO_FRAME);

                if (!document.hidden) {
                    engine.processVideoFrame();
                }
            }
        }
        requestAnimationFrame(loop);
    } catch (e) {
        console.error("Falha na inicialização do sistema AR. - app.js:57", e);
    }
}
if (botaoFechar) {
    botaoFechar.addEventListener('click', () => {
        if (confirm("Tem certeza que deseja fechar o aplicativo?")) {
            const stream = video.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            window.close();
        }
    });
}

botoesCores.forEach(botao => {
    botao.addEventListener('click', (e) => {
        document.querySelector('.color-card.active')?.classList.remove('active');
        e.currentTarget.classList.add('active');
        const previewCor = e.currentTarget.querySelector('.color-preview');
        const corHex = window.getComputedStyle(previewCor).backgroundColor;
        engine.mudarCorEsmalte(rgbToHex(corHex));
    });
});

function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const rgbValores = rgb.match(/\d+/g);
    return "#" + ((1 << 24) + (parseInt(rgbValores[0]) << 16) + (parseInt(rgbValores[1]) << 8) + parseInt(rgbValores[2])).toString(16).slice(1);
}

main();