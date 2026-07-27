const fs = require('fs');
const path = require('path');

// Polyfill FileReader for Node env for Three GLTFExporter
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      Promise.resolve(blob.arrayBuffer()).then(buffer => {
        this.result = buffer;
        if (this.onloadend) this.onloadend();
        if (this.onload) this.onload();
      }).catch(err => {
        if (this.onerror) this.onerror(err);
      });
    }
  };
}

const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

function generateModel() {
  const chairGroup = new THREE.Group();
  chairGroup.name = "ModernArchitecturalArmchair";

  const fabricMaterial = new THREE.MeshStandardMaterial({
    color: 0xe3ded7,
    roughness: 0.85,
    metalness: 0.05,
    name: "BoucleFabric"
  });

  const cushionMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6cfc4,
    roughness: 0.8,
    metalness: 0.05,
    name: "CushionFabric"
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.8,
    name: "DarkMetalFrame"
  });

  const brassMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8a96e,
    roughness: 0.35,
    metalness: 0.85,
    name: "BrassAccent"
  });

  // 1. Seat Cushion
  const seatGeo = new THREE.CylinderGeometry(0.85, 0.8, 0.28, 32);
  const seatMesh = new THREE.Mesh(seatGeo, cushionMaterial);
  seatMesh.position.y = 0.45;
  chairGroup.add(seatMesh);

  // Extra inner plush cushion
  const innerCushionGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.12, 32);
  const innerCushionMesh = new THREE.Mesh(innerCushionGeo, fabricMaterial);
  innerCushionMesh.position.y = 0.58;
  chairGroup.add(innerCushionMesh);

  // 2. Backrest
  const backrestMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.18, 16, 48, Math.PI * 1.25),
    fabricMaterial
  );
  backrestMesh.rotation.x = Math.PI / 2;
  backrestMesh.rotation.z = -Math.PI * 0.125;
  backrestMesh.position.set(0, 0.88, -0.05);
  chairGroup.add(backrestMesh);

  // Back pillow
  const pillowGeo = new THREE.SphereGeometry(0.42, 24, 16);
  pillowGeo.scale(1.2, 0.85, 0.4);
  const pillowMesh = new THREE.Mesh(pillowGeo, cushionMaterial);
  pillowMesh.position.set(0, 0.82, -0.45);
  pillowMesh.rotation.x = 0.2;
  chairGroup.add(pillowMesh);

  // 3. Legs
  const legPositions = [
    [-0.6, 0.22, 0.55],
    [0.6, 0.22, 0.55],
    [-0.55, 0.22, -0.55],
    [0.55, 0.22, -0.55]
  ];

  const legAngles = [
    [0.18, 0, -0.18],
    [0.18, 0, 0.18],
    [-0.18, 0, -0.18],
    [-0.18, 0, 0.18]
  ];

  legPositions.forEach((pos, i) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(pos[0], pos[1], pos[2]);

    const legGeo = new THREE.CylinderGeometry(0.035, 0.02, 0.48, 16);
    const legMesh = new THREE.Mesh(legGeo, frameMaterial);
    legMesh.rotation.set(legAngles[i][0], legAngles[i][1], legAngles[i][2]);
    legGroup.add(legMesh);

    const footGeo = new THREE.CylinderGeometry(0.022, 0.025, 0.08, 16);
    const footMesh = new THREE.Mesh(footGeo, brassMaterial);
    footMesh.position.set(pos[0] * 0.15, -0.22, pos[2] * 0.15);
    legGroup.add(footMesh);

    chairGroup.add(legGroup);
  });

  // 4. Base Ring
  const ringGeo = new THREE.TorusGeometry(0.72, 0.025, 12, 32);
  const ringMesh = new THREE.Mesh(ringGeo, frameMaterial);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.32;
  chairGroup.add(ringMesh);

  chairGroup.position.set(0, -0.4, 0);

  const exporter = new GLTFExporter();
  exporter.parse(
    chairGroup,
    (gltfArrayBuffer) => {
      const buffer = Buffer.from(gltfArrayBuffer);
      const outputPath = path.join(__dirname, '..', 'public', 'model.glb');
      fs.writeFileSync(outputPath, buffer);
      console.log(`SUCCESS: Wrote ${outputPath} (${buffer.length} bytes)`);
    },
    (err) => {
      console.error('Error exporting GLTF:', err);
    },
    { binary: true }
  );
}

generateModel();
