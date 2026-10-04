/**
 * detect-devtools.js
 * Placeholder untuk deteksi DevTools.
 * Kalau tidak mau blokir DevTools, biarkan seperti ini (no-op).
 */

(function() {
    'use strict';

    // Placeholder - tidak memblokir apapun
    // Kalau mau aktifkan block DevTools, uncomment kode di bawah

    window.DisableDevtool = function(options) {
        // No-op by default
        console.log('[detect-devtools] Initialized (disabled mode)');
    };

    // --- Uncomment kalau mau aktifkan block DevTools ---
    /*
    let devtoolsOpen = false;
    const threshold = 160;

    function checkDevTools() {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                document.body.innerHTML = '<div style="color:white;text-align:center;padding:50px;font-family:sans-serif;">⚠️ DevTools terdeteksi. Silakan tutup untuk melanjutkan.</div>';
            }
        } else {
            devtoolsOpen = false;
        }
    }
    setInterval(checkDevTools, 1000);
    */
})();
