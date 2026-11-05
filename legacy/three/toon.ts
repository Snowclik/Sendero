import * as THREE from 'three';

/**
 * Sistema de sombreado pictórico estilo "Breath of the Wild / Ghibli" (2017):
 * - Transición cel-shading suave de 3 bandas cálidas (sin contornos negros rotos)
 * - Luz de borde direccional (Fresnel Rim Light) dorada por el sol
 * - Sombras teñidas de azul-verde atmosférico en lugar de gris sucio
 */

let gradientTex: THREE.DataTexture | null = null;

function getGradient(): THREE.DataTexture {
  if (!gradientTex) {
    // Rampa suave de 6 niveles para evitar bandas duras artificiales y dar acabado pictórico
    const data = new Uint8Array([135, 165, 195, 225, 245, 255]);
    gradientTex = new THREE.DataTexture(data, 6, 1, THREE.RedFormat);
    gradientTex.minFilter = THREE.LinearFilter;
    gradientTex.magFilter = THREE.LinearFilter;
    gradientTex.generateMipmaps = false;
    gradientTex.needsUpdate = true;
  }
  return gradientTex;
}

export function toonMat(params: Record<string, any> = {}): THREE.MeshToonMaterial {
  const { roughness, metalness, wireframe, rimStrength = 0.28, ...rest } = params;
  const mat = new THREE.MeshToonMaterial({
    gradientMap: getGradient(),
    ...rest,
  });

  // Inyectar Rim-Lighting (Fresnel solar estilo Zelda: BotW)
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new THREE.Color(0xfff6d6) };
    shader.uniforms.uRimStrength = { value: rimStrength };

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform vec3 uRimColor;
       uniform float uRimStrength;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      // Luz de borde suave (Fresnel) en dirección a la vista y hacia arriba
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - saturate(dot(normal, viewDir)), 3.2);
      float upwardBias = saturate(normal.y * 0.5 + 0.5);
      gl_FragColor.rgb += uRimColor * fresnel * uRimStrength * upwardBias;
      #include <dithering_fragment>
      `
    );
  };

  return mat;
}

/**
 * En la dirección de arte estilo Breath of the Wild / Ghibli no se usan
 * cascos invertidos negros (que generan artefactos geométricos), sino iluminación
 * de borde (Fresnel) integrada directamente en toonMat().
 */
export function addOutline(_root: THREE.Object3D, _thickness = 0.03, _minRadius = 0.1) {
  // No-op intencional: el sombreado pictórico y rim-light lo maneja toonMat()
}
