(function () {
    const vscode = acquireVsCodeApi();

    // Helper: safe getElementById
    function el(id) {
        const e = document.getElementById(id);
        if (!e) console.warn('CyanoBact: missing element #' + id);
        return e;
    }

    // ── Elements ─────────────────────────────────────────────────────────────
    const bgInput          = el('bg-color');
    const accentInput      = el('accent-color');
    const secondaryInput   = el('secondary-color');
    const purpleInput      = el('purple-color');
    const stringInput      = el('string-color');
    const commentInput     = el('comment-color');
    const numberInput      = el('number-color');
    const lineNumInput     = el('linenumber-color');
    const gutterInput      = el('gutter-color');
    const selectionInput   = el('selection-color');
    const opacitySlider    = el('opacity-slider');
    const opacityVal       = el('opacity-val');

    const badgeBgInput     = el('badge-bg-color');
    const sidebarBorderInput = el('sidebar-border-color');
    const buttonBgInput    = el('button-bg-color');
    const inputBgInput     = el('input-bg-color');
    const notifBgInput     = el('notif-bg-color');
    const gitModInput      = el('git-mod-color');
    const gitDelInput      = el('git-del-color');
    const gitNewInput      = el('git-new-color');

    const termBgInput      = el('terminal-bg-color');
    const termFgInput      = el('terminal-fg-color');
    const termCursorInput  = el('terminal-cursor-color');
    const ansiCyanInput    = el('ansi-cyan-color');
    const ansiGreenInput   = el('ansi-green-color');

    const applyBtn         = el('apply-btn');
    const resetBtn         = el('reset-btn');
    const exportBtn        = el('export-btn');
    const saveThemeBtn     = el('save-theme-btn');
    const savedThemesGrid  = el('saved-themes-grid');

    const previewTitleBar  = el('preview-titlebar');
    const previewSidebar   = el('preview-sidebar');
    const previewEditor    = el('preview-editor');
    const previewStatusBar = el('preview-statusbar');

    // ── Presets ───────────────────────────────────────────────────────────────
    const presets = {
        cyano:       { bg: '#0b0d17', accent: '#55eefd', secondary: '#00b0ff', purple: '#d57bff' },
        emerald:     { bg: '#061109', accent: '#2ecc71', secondary: '#1abc9c', purple: '#f1c40f' },
        sunset:      { bg: '#1a0b17', accent: '#ff00ff', secondary: '#ff8000', purple: '#ffcc00' },
        nordic:      { bg: '#1b2b34', accent: '#88c0d0', secondary: '#81a1c1', purple: '#b48ead' },
        'light-cyan':{ bg: '#f0faff', accent: '#008cff', secondary: '#005bb7', purple: '#7b61ff' },
        sand:        { bg: '#faf7f2', accent: '#9b6d43', secondary: '#7a4e2a', purple: '#5d4037' }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getBrightness(hex) {
        if (!hex || hex.length < 7) return 0;
        const rgb = parseInt(hex.slice(1, 7), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >>  8) & 0xff;
        const b = (rgb >>  0) & 0xff;
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    function getHexAlpha() {
        const val = parseInt(opacitySlider.value);
        if (opacityVal) opacityVal.textContent = Math.round((val / 255) * 100) + '%';
        return val.toString(16).padStart(2, '0');
    }

    function autoFg(hex) {
        return getBrightness(hex) > 128 ? '#000000' : '#ffffff';
    }

    // ── Tab Navigation ────────────────────────────────────────────────────────
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = el(`tab-${btn.dataset.tab}`);
            if (target) target.classList.add('active');
        });
    });

    // ── Preview ───────────────────────────────────────────────────────────────
    function updatePreview() {
        const alpha = getHexAlpha();
        const bgBase = bgInput.value;
        const accent = accentInput.value;

        const isLight = getBrightness(bgBase) > 128;
        const mock = document.querySelector('.vscode-mock');
        if (mock) {
            mock.classList.toggle('light-mode', isLight);
            const codeEl = document.querySelector('.code');
            if (codeEl) codeEl.style.color = isLight ? '#333' : '#eeffff';
        }

        if (previewEditor)    previewEditor.style.backgroundColor    = bgBase + alpha;
        if (previewSidebar)   previewSidebar.style.backgroundColor   = bgBase + alpha;
        if (previewTitleBar)  previewTitleBar.style.backgroundColor  = bgBase + alpha;
        if (previewStatusBar) previewStatusBar.style.backgroundColor = accentInput.value;

        const lineNums = document.querySelector('.line-numbers');
        if (lineNums && lineNumInput) lineNums.style.color = lineNumInput.value;

        const title = document.querySelector('.title');
        if (title) title.style.color = accent;

        const activeFile = document.querySelector('.file.active');
        if (activeFile) activeFile.style.color = accent;

        document.querySelectorAll('.keyword').forEach(e => { if (purpleInput) e.style.color = purpleInput.value; });
        document.querySelectorAll('.function').forEach(e => { if (secondaryInput) e.style.color = secondaryInput.value; });
        document.querySelectorAll('.string').forEach(e => { if (stringInput) e.style.color = stringInput.value; });
        document.querySelectorAll('.comment').forEach(e => { if (commentInput) e.style.color = commentInput.value; });
        document.querySelectorAll('.number').forEach(e => { if (numberInput) e.style.color = numberInput.value; });
        document.querySelectorAll('.mock-type').forEach(e => { e.style.color = '#4ec9b0'; });

        document.documentElement.style.setProperty('--accent', accent);
    }

    // ── Build Payload ─────────────────────────────────────────────────────────
    function buildPayload() {
        const alpha = getHexAlpha();
        return {
            workbench: {
                'titleBar.activeBackground':                     bgInput.value + alpha,
                'titleBar.activeForeground':                     accentInput.value,
                'activityBar.background':                        bgInput.value + alpha,
                'activityBar.foreground':                        accentInput.value,
                'editor.background':                             bgInput.value + alpha,
                'sideBar.background':                            bgInput.value + alpha,
                'statusBar.background':                          bgInput.value + alpha,
                'statusBar.foreground':                          accentInput.value,
                'editorCursor.foreground':                       accentInput.value,
                'editorIndentGuide.activeBackground':            accentInput.value,
                'tab.activeBorder':                              accentInput.value,
                'tab.activeForeground':                          accentInput.value,
                'editorLineNumber.foreground':                   lineNumInput.value,
                'editorGutter.background':                       gutterInput.value,
                'editor.selectionBackground':                    selectionInput.value,
                'activityBarBadge.background':                   badgeBgInput.value,
                'activityBarBadge.foreground':                   autoFg(badgeBgInput.value),
                'sideBar.border':                                sidebarBorderInput.value,
                'button.background':                             buttonBgInput.value,
                'button.foreground':                             autoFg(buttonBgInput.value),
                'input.background':                              inputBgInput.value,
                'input.foreground':                              autoFg(inputBgInput.value),
                'notifications.background':                      notifBgInput.value,
                'notifications.foreground':                      autoFg(notifBgInput.value),
                'gitDecoration.modifiedResourceForeground':      gitModInput.value,
                'gitDecoration.deletedResourceForeground':       gitDelInput.value,
                'gitDecoration.untrackedResourceForeground':     gitNewInput.value,
                'terminal.background':                           termBgInput.value,
                'terminal.foreground':                           termFgInput.value,
                'terminalCursor.foreground':                     termCursorInput.value,
                'terminal.ansiCyan':                             ansiCyanInput.value,
                'terminal.ansiGreen':                            ansiGreenInput.value
            },
            tokens: {
                string:   stringInput.value,
                comment:  commentInput.value,
                number:   numberInput.value,
                keyword:  purpleInput.value,
                function: secondaryInput.value
            }
        };
    }

    // ── Apply ─────────────────────────────────────────────────────────────────
    function applyChanges() {
        const payload = buildPayload();
        console.log('CyanoBact: posting applyColors', payload);
        vscode.postMessage({ command: 'applyColors', payload });
    }

    // ── initColors from extension host ────────────────────────────────────────
    window.addEventListener('message', event => {
        const msg = event.data;
        if (msg.command !== 'initColors') return;
        const c = msg.colors;
        if (!c) return;

        function set(inp, key) {
            if (inp && c[key]) inp.value = c[key].substring(0, 7);
        }

        const bgFull = c['editor.background'];
        if (bgFull) {
            bgInput.value = bgFull.substring(0, 7);
            if (bgFull.length > 7) opacitySlider.value = parseInt(bgFull.substring(7), 16);
        }

        set(accentInput,        'activityBar.foreground');
        set(secondaryInput,     'tab.activeForeground');
        set(lineNumInput,       'editorLineNumber.foreground');
        set(gutterInput,        'editorGutter.background');
        set(selectionInput,     'editor.selectionBackground');
        set(badgeBgInput,       'activityBarBadge.background');
        set(sidebarBorderInput, 'sideBar.border');
        set(buttonBgInput,      'button.background');
        set(inputBgInput,       'input.background');
        set(notifBgInput,       'notifications.background');
        set(gitModInput,        'gitDecoration.modifiedResourceForeground');
        set(gitDelInput,        'gitDecoration.deletedResourceForeground');
        set(gitNewInput,        'gitDecoration.untrackedResourceForeground');
        set(termBgInput,        'terminal.background');
        set(termFgInput,        'terminal.foreground');
        set(termCursorInput,    'terminalCursor.foreground');
        set(ansiCyanInput,      'terminal.ansiCyan');
        set(ansiGreenInput,     'terminal.ansiGreen');

        updatePreview();
    });

    // ── Presets ───────────────────────────────────────────────────────────────
    function setPreset(key) {
        const p = presets[key];
        if (!p) return;
        bgInput.value       = p.bg;
        accentInput.value   = p.accent;
        secondaryInput.value= p.secondary;
        purpleInput.value   = p.purple;
        opacitySlider.value = 255;
        updatePreview();
    }

    document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.preset) setPreset(card.dataset.preset);
        });
    });

    // ── Saved Themes ──────────────────────────────────────────────────────────
    function loadSavedThemes() {
        if (!savedThemesGrid) return;
        const saved = JSON.parse(localStorage.getItem('cyano-saved-themes') || '[]');
        savedThemesGrid.innerHTML = '';
        saved.forEach((theme, index) => {
            const wrap = document.createElement('div');
            wrap.className = 'preset-item';

            const btn = document.createElement('button');
            btn.className = 'preset-card';
            btn.innerHTML = `
                <div class="card-preview" style="background:${theme.bg};">
                    <span style="background:${theme.accent};"></span>
                </div>
                <span>Theme ${index + 1}</span>
            `;
            btn.onclick = () => {
                bgInput.value        = theme.bg.substring(0, 7);
                opacitySlider.value  = theme.bg.length > 7 ? parseInt(theme.bg.substring(7), 16) : 255;
                accentInput.value    = theme.accent;
                secondaryInput.value = theme.secondary;
                purpleInput.value    = theme.purple;
                if (theme.strings)  stringInput.value  = theme.strings;
                if (theme.comments) commentInput.value = theme.comments;
                if (theme.numbers)  numberInput.value  = theme.numbers;
                if (theme.lineNum)  lineNumInput.value  = theme.lineNum;
                if (theme.termBg)   termBgInput.value   = theme.termBg;
                if (theme.badgeBg)  badgeBgInput.value  = theme.badgeBg;
                updatePreview();
            };

            const del = document.createElement('button');
            del.className = 'remove-btn';
            del.textContent = 'Remove';
            del.onclick = e => { e.stopPropagation(); deleteTheme(index); };

            wrap.appendChild(btn);
            wrap.appendChild(del);
            savedThemesGrid.appendChild(wrap);
        });
    }

    function saveTheme() {
        const saved = JSON.parse(localStorage.getItem('cyano-saved-themes') || '[]');
        saved.push({
            bg:       bgInput.value + getHexAlpha(),
            accent:   accentInput.value,
            secondary:secondaryInput.value,
            purple:   purpleInput.value,
            strings:  stringInput.value,
            comments: commentInput.value,
            numbers:  numberInput.value,
            lineNum:  lineNumInput.value,
            termBg:   termBgInput.value,
            badgeBg:  badgeBgInput.value
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

    // ── Export JSON ───────────────────────────────────────────────────────────
    function exportJson() {
        const alpha = getHexAlpha();
        const theme = {
            name: 'CyanoBact Custom',
            colors: {
                'editor.background':             bgInput.value + alpha,
                'sideBar.background':            bgInput.value + alpha,
                'editorLineNumber.foreground':   lineNumInput.value,
                'activityBarBadge.background':   badgeBgInput.value,
                'terminal.background':           termBgInput.value,
                'terminal.foreground':           termFgInput.value
            },
            tokenColors: [
                { scope: 'string',          settings: { foreground: stringInput.value  } },
                { scope: 'comment',         settings: { foreground: commentInput.value } },
                { scope: 'constant.numeric',settings: { foreground: numberInput.value  } }
            ]
        };
        const blob = new Blob([JSON.stringify(theme, null, 4)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'cyanobact-theme.json';
        a.click();
    }

    // ── Event Listeners ───────────────────────────────────────────────────────
    [bgInput, accentInput, secondaryInput, purpleInput,
     stringInput, commentInput, numberInput,
     lineNumInput, gutterInput, selectionInput, opacitySlider,
     termBgInput, termFgInput, termCursorInput, ansiCyanInput, ansiGreenInput,
     badgeBgInput, sidebarBorderInput, buttonBgInput, inputBgInput, notifBgInput,
     gitModInput, gitDelInput, gitNewInput
    ].forEach(inp => { if (inp) inp.addEventListener('input', updatePreview); });

    if (applyBtn)     applyBtn.addEventListener('click', applyChanges);
    if (resetBtn)     resetBtn.addEventListener('click', () => { opacitySlider.value = 255; setPreset('cyano'); });
    if (exportBtn)    exportBtn.addEventListener('click', exportJson);
    if (saveThemeBtn) saveThemeBtn.addEventListener('click', saveTheme);

    // ── Init ──────────────────────────────────────────────────────────────────
    loadSavedThemes();
    updatePreview();
    vscode.postMessage({ command: 'ready' });

}());
