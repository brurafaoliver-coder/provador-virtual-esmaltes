import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { RoundedBoxGeometry } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js";

export class AREngine {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.handLandmarker = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.nailMeshesMao1 = [];
        this.nailMeshesMao2 = [];
        // Cor inicial igual à do card ativo por padrão ("Renda")
        this.currentHexColor = "#F6F6F6";

        // Proporção (largura/altura) do canvas, usada para corrigir distorção
        this.aspect = 1;

        // Fator de ajuste do tamanho da unha 3D em relação ao tamanho da
        // falange detectada (distância entre a ponta do dedo e a articulação
        // abaixo). Aumente para unhas maiores/mais cobertura, diminua para
        // unhas menores.
        this.FATOR_TAMANHO_UNHA = 0.4;

        // Offset de rotação (em radianos) aplicado somente à unha do
        // polegar. O polegar tem uma orientação anatômica diferente dos
        // outros dedos; mesmo usando a articulação MCP como referência de
        // direção, um pequeno ajuste fino deixa a unha alinhada de forma
        // mais natural com a ponta real do dedo. Ajuste este valor (em
        // radianos, ex: 0.15 ≈ 8.6°) se a unha do polegar ainda parecer
        // torta na sua mão.
        this.OFFSET_ROTACAO_POLEGAR = 0;
    }

    async initDetector() {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2
        });
    }

    initThreeJS() {
        this.scene = new THREE.Scene();

        this.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.OrthographicCamera(-this.aspect, this.aspect, 1, -1, 0.1, 10);
        this.camera.position.z = 1;
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(0, 1, 1);
        this.scene.add(dirLight);

        this.setupNailObjects();

        // Recalcula a proporção sempre que o tamanho do canvas mudar
        // (ex: rotação do celular), para evitar distorção da unha 3D.
        window.addEventListener('resize', () => {
            if (!this.renderer || !this.camera) return;
            this.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
            this.camera.left = -this.aspect;
            this.camera.right = this.aspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
        });
    }

    setupNailObjects() {
        // Pontas dos dedos (landmarks do MediaPipe): polegar, indicador, médio, anelar, mindinho
        this.fingerTipIds = [4, 8, 12, 16, 20];

        // Para cada ponta, qual landmark usar como referência de "direção
        // do dedo". Para os 4 dedos longos, a articulação imediatamente
        // abaixo da ponta (id - 1) já dá um vetor bem vertical/alinhado ao
        // dedo. O polegar é estruturalmente diferente: a articulação
        // imediatamente abaixo da ponta (landmark 3, IP) fica num ângulo
        // que deixa o vetor quase horizontal, fazendo a unha aparecer
        // "deitada". Usamos o landmark 2 (MCP do polegar) como referência,
        // que acompanha melhor o eixo real da última falange do polegar.
        this.jointRefIds = { 4: 2, 8: 7, 12: 11, 16: 15, 20: 19 };

        // Geometria de tamanho unitário (formato "quadrada arredondada", como
        // na referência visual): uma caixa achatada com os cantos
        // suavizados. O tamanho real de cada unha é definido dinamicamente
        // por mesh.scale em atualizarPosicaoUnha, com base na falange
        // detectada de cada dedo.
        // Importante: o raio dos cantos não pode exceder a metade da menor
        // dimensão (aqui, depth = 0.4 → raio máximo de 0.2), senão o
        // resultado visual fica disforme.
        const geometry = new RoundedBoxGeometry(1.1, 1.5, 0.4, 4, 0.18);

        this.nailMeshesMao1 = [];
        this.nailMeshesMao2 = [];

        const criarUnhasParaMao = (arrayDestino) => {
            this.fingerTipIds.forEach(() => {
                const material = new THREE.MeshPhysicalMaterial({
                    color: this.currentHexColor,
                    roughness: 0.1,
                    metalness: 0.1,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.visible = false;
                this.scene.add(mesh);
                arrayDestino.push(mesh);
            });
        };

        criarUnhasParaMao(this.nailMeshesMao1);
        criarUnhasParaMao(this.nailMeshesMao2);
    }

    mudarCorEsmalte(hexColor) {
        this.currentHexColor = hexColor;
        [...this.nailMeshesMao1, ...this.nailMeshesMao2].forEach(mesh => {
            mesh.material.color.set(hexColor);
        });
    }

    processVideoFrame() {
        if (!this.handLandmarker || this.video.readyState !== 4) return;
        const startTimeMs = performance.now();
        const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);

        this.nailMeshesMao1.forEach(m => m.visible = false);
        this.nailMeshesMao2.forEach(m => m.visible = false);

        if (results.landmarks && results.landmarks.length > 0) {
            const pontosMao1 = results.landmarks[0];
            this.fingerTipIds.forEach((id, index) => {
                const idArticulacao = this.jointRefIds[id];
                this.atualizarPosicaoUnha(this.nailMeshesMao1[index], pontosMao1[id], pontosMao1[idArticulacao], id);
            });

            if (results.landmarks.length > 1) {
                const pontosMao2 = results.landmarks[1];
                this.fingerTipIds.forEach((id, index) => {
                    const idArticulacao = this.jointRefIds[id];
                    this.atualizarPosicaoUnha(this.nailMeshesMao2[index], pontosMao2[id], pontosMao2[idArticulacao], id);
                });

                const indicadorMao1 = pontosMao1[8];
                const indicadorMao2 = pontosMao2[8];

                const distancia = Math.sqrt(
                    Math.pow(indicadorMao1.x - indicadorMao2.x, 2) +
                    Math.pow(indicadorMao1.y - indicadorMao2.y, 2)
                );
                if (distancia < 0.15) {
                    this.dispararFeedbackProximidade();
                }
            }
        }
        this.renderer.render(this.scene, this.camera);
    }

    atualizarPosicaoUnha(mesh, pontoUnha, articulacaoAbaixo, fingerTipId) {
        const alvoX = ((pontoUnha.x * 2) - 1) * this.aspect;
        const alvoY = -(pontoUnha.y * 2) + 1;

        // Usa a distância entre a ponta do dedo e a articulação de
        // referência (a falange) como "marcador" para calcular o tamanho
        // real da unha na tela, em vez de um tamanho fixo.
        const direcaoX = pontoUnha.x - articulacaoAbaixo.x;
        const direcaoY = pontoUnha.y - articulacaoAbaixo.y;
        const tamanhoFalange = Math.sqrt(
            Math.pow(direcaoX * 2 * this.aspect, 2) +
            Math.pow(direcaoY * 2, 2)
        );
        const escalaAlvo = tamanhoFalange * this.FATOR_TAMANHO_UNHA;

        if (mesh.visible) {
            mesh.position.x += (alvoX - mesh.position.x) * 0.4;
            mesh.position.y += (alvoY - mesh.position.y) * 0.4;
            const novaEscala = mesh.scale.x + (escalaAlvo - mesh.scale.x) * 0.4;
            mesh.scale.setScalar(novaEscala);
        } else {
            mesh.position.x = alvoX;
            mesh.position.y = alvoY;
            mesh.scale.setScalar(escalaAlvo);
        }
        mesh.position.z = 0;

        const offset = fingerTipId === 4 ? this.OFFSET_ROTACAO_POLEGAR : 0;
        mesh.rotation.z = Math.atan2(direcaoY, direcaoX) - (Math.PI / 2) + offset;
        mesh.visible = true;
    }

    dispararFeedbackProximidade() {
        const painelUI = document.querySelector('.controls-panel h2');
        if (painelUI && !painelUI.dataset.comboAtivado) {
            painelUI.innerHTML += ' <span style="margin-left: 8px; font-weight: bold;">✓</span>';
            painelUI.style.color = "#039137";
            painelUI.dataset.comboAtivado = "true";

            if (navigator.vibrate) navigator.vibrate(100);
        }
    }
}