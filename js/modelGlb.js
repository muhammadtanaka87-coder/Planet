// modelGlb.js — Disabled karena nggak ada file .glb
export class Heart {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.mixer = null;
        console.log('[Heart] 3D model disabled (no .glb file)');
    }
    
    loadModel() {
        // Skip - nggak ada file .glb
    }
    
    animate() {
        // No-op
    }
}
