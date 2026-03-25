(function () {
    const vscode = acquireVsCodeApi();

    // Elements
    const bgInput = document.getElementById('bg-color');
    const accentInput = document.getElementById('accent-color');
    const secondaryInput = document.getElementById('secondary-color');
    const purpleInput = document.getElementById('purple-color');
    const applyBtn = document.getElementById('apply-btn');
    const resetBtn = document.getElementById('reset-btn');
    const exportBtn = document.getElementById('export-btn');
    const saveThemeBtn = document.getElementById('save-theme-btn');
    const savedThemesGrid = document.getElementById('saved-themes-grid');
    const advancedToggleBtn = document.getElementById('advanced-toggle-btn');
    const advancedSettings = document.getElementById('advanced-settings');
    const lineNumInput = document.getElementById('linenumber-color');
    const gutterInput = document.getElementById('gutter-color');
    const selectionInput = document.getElementById('selection-color');
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityVal = document.getElementById('opacity-val');

    const previewTitleBar = document.getElementById('preview-titlebar');
    const previewSidebar = document.getElementById('preview-sidebar');
    const previewEditor = document.getElementById('preview-editor');
    const previewStatusBar = document.getElementById('preview-statusbar');

    const presets = {
        cyano: { bg: "#0b0d17", accent: "#55eefd", secondary: "#00b0ff", purple: "#d57bff" },
        emerald: { bg: "#061109", accent: "#2ecc71", secondary: "#1abc9c", purple: "#f1c40f" },
        sunset: { bg: "#1a0b17", accent: "#ff00ff", secondary: "#ff8000", purple: "#ffcc00" },
        nordic: { bg: "#1b2b34", accent: "#88c0d0", secondary: "#81a1c1", purple: "#b48ead" },
        "light-cyan": { bg: "#f0faff", accent: "#008cff", secondary: "#005bb7", purple: "#7b61ff" },
        sand: { bg: "#faf7f2", accent: "#9b6d43", secondary: "#7a4e2a", purple: "#5d4037" }
    };

    // Tabs Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    advancedToggleBtn.addEventListener('click', () => {
        const isHidden = advancedSettings.classList.toggle('hidden');
        advancedToggleBtn.textContent = isHidden ? 'Show' : 'Hide';
    });

    function getBrightness(hex) {
        const rgb = parseInt(hex.substring(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >>  8) & 0xff;
        const b = (rgb >>  0) & 0xff;
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    function getHexAlpha() {
        const alpha = parseInt(opacitySlider.value).toString(16).padStart(2, '0');
        opacityVal.textContent = Math.round((opacitySlider.value / 255) * 100) + '%';
        return alpha;
    }

    function updatePreview() {
        const alpha = getHexAlpha();
        const bg = bgInput.value + alpha;
        const accent = accentInput.value;
        const secondary = secondaryInput.value;
        const purple = purpleInput.value;
        const lineNum = lineNumInput.value;

        const isLight = getBrightness(bgInput.value) > 128;
        const mock = document.querySelector('.vscode-mock');
        if (isLight) {
            mock.classList.add('light-mode');
            document.querySelector('.code').style.color = "#333";
        } else {
            mock.classList.remove('light-mode');
            document.querySelector('.code').style.color = "#eeffff";
        }

        previewEditor.style.backgroundColor = bg;
        previewSidebar.style.backgroundColor = bg;
        previewTitleBar.style.backgroundColor = bg;
        document.querySelector('.line-numbers').style.color = lineNum;
        document.querySelector('.title').style.color = accent;
        document.querySelector('.file.active').style.color = accent;
        previewStatusBar.style.color = accent;
        previewStatusBar.style.borderTopColor = accent;

        document.querySelectorAll('.keyword').forEach(el => el.style.color = purple);
        document.querySelectorAll('.function').forEach(el => el.style.color = secondary);
        document.documentElement.style.setProperty('--accent', accent);
    }

    function loadSavedThemes() {
        const saved = JSON.parse(localStorage.getItem('cyano-saved-themes') || '[]');
        savedThemesGrid.innerHTML = '';
        saved.forEach((theme, index) => {
            const container = document.createElement('div');
            container.className = 'preset-item';
            
            const btn = document.createElement('button');
            btn.className = 'preset-card';
            btn.innerHTML = `
                <div class="card-preview" style="background: ${theme.bg};">
                    <span style="background: ${theme.accent};"></span>
                </div>
                <span>Theme ${index + 1}</span>
            `;
            btn.onclick = () => {
                bgInput.value = theme.bg.substring(0, 7);
                if (theme.bg.length > 7) {
                    opacitySlider.value = parseInt(theme.bg.substring(7), 16);
                } else {
                    opacitySlider.value = 255;
                }
                accentInput.value = theme.accent;
                secondaryInput.value = theme.secondary;
                purpleInput.value = theme.purple;
                updatePreview();
            };

            const del = document.createElement('button');
            del.className = 'remove-btn';
            del.innerHTML = 'Remove';
            del.onclick = (e) => {
                e.stopPropagation();
                deleteTheme(index);
            };

            container.appendChild(btn);
            container.appendChild(del);
            savedThemesGrid.appendChild(container);
        });
    }

    function saveTheme() {
        const saved = JSON.parse(localStorage.getItem('cyano-saved-themes') || '[]');
        saved.push({
            bg: bgInput.value + getHexAlpha(),
            accent: accentInput.value,
            secondary: secondaryInput.value,
            purple: purpleInput.value
        });
        localStorage.setItem('cyano-saved-themes', JSON.stringify(saved));
        loadSavedThemes();
    }

    function deleteTheme(index) {
        const saved = JSON.parse(localStorage.getItem('cyano-saved-themes') || '[]');
        saved.splice(index, 1);
        localStorage.setItem('cyano-saved-themes', JSON.stringify(saved));
        loadSavedThemes();
    }

    function setPreset(key) {
        const p = presets[key];
        if (!p) return;
        bgInput.value = p.bg;
        accentInput.value = p.accent;
        secondaryInput.value = p.secondary;
        purpleInput.value = p.purple;
        opacitySlider.value = 255;
        updatePreview();
    }

    document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => setPreset(card.dataset.preset));
    });

    [bgInput, accentInput, secondaryInput, purpleInput, lineNumInput, gutterInput, selectionInput, opacitySlider].forEach(inp => {
        inp.addEventListener('input', updatePreview);
    });

    saveThemeBtn.addEventListener('click', saveTheme);

    resetBtn.addEventListener('click', () => {
        opacitySlider.value = 255;
        lineNumInput.value = "#3b4252";
        gutterInput.value = "#0b0d17";
        selectionInput.value = "#311b92";
        setPreset('cyano');
    });

    applyBtn.addEventListener('click', () => {
        const alpha = getHexAlpha();
        const colors = {
            "titleBar.activeBackground": bgInput.value + alpha,
            "titleBar.activeForeground": accentInput.value,
            "activityBar.background": bgInput.value + alpha,
            "activityBar.foreground": accentInput.value,
            "editor.background": bgInput.value + alpha,
            "sideBar.background": bgInput.value + alpha,
            "statusBar.background": "#02160c",
            "statusBar.foreground": accentInput.value,
            "editorCursor.foreground": accentInput.value,
            "editorIndentGuide.activeBackground": accentInput.value,
            "tab.activeBorder": accentInput.value,
            "tab.activeForeground": accentInput.value,
            "editorLineNumber.foreground": lineNumInput.value,
            "editorGutter.background": gutterInput.value,
            "editor.selectionBackground": selectionInput.value
        };
        vscode.postMessage({ command: 'applyColors', colors: colors });
    });

    exportBtn.addEventListener('click', () => {
        const alpha = getHexAlpha();
        const theme = {
            "name": "CyanoBact Custom",
            "colors": {
                "editor.background": bgInput.value + alpha,
                "sideBar.background": bgInput.value + alpha,
                "editorLineNumber.foreground": lineNumInput.value,
                "editorGutter.background": gutterInput.value,
                "editor.selectionBackground": selectionInput.value
            }
        };
        const blob = new Blob([JSON.stringify(theme, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cyanobact-theme.json';
        a.click();
    });

    resetBtn.addEventListener('click', () => setPreset('cyano'));

    loadSavedThemes();
    updatePreview();
}());
