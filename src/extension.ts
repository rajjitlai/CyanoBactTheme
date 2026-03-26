import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	console.log('CyanoBact Extension is now active!');

	let disposable = vscode.commands.registerCommand('cyanobact.openThemeBuilder', () => {
		const panel = vscode.window.createWebviewPanel(
			'cyanoBactThemeBuilder',
			'CyanoBact Theme Builder',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
			}
		);

		const htmlPath = path.join(context.extensionPath, 'media', 'webview.html');
		let htmlContent = fs.readFileSync(htmlPath, 'utf8');

		// Replace local resource placeholders
		const styleUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'style.css')));
		const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'main.js')));
		
		htmlContent = htmlContent.replace('${styleUri}', styleUri.toString());
		htmlContent = htmlContent.replace('${scriptUri}', scriptUri.toString());

		panel.webview.html = htmlContent;

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'ready':
						// Webview is ready — now it's safe to send initial colors
						try {
							const themePath = path.join(context.extensionPath, 'themes', 'Cyano Bact Theme-color-theme.json');
							const themeJson = JSON.parse(fs.readFileSync(themePath, 'utf8'));
							if (themeJson && themeJson.colors) {
								panel.webview.postMessage({ command: 'initColors', colors: themeJson.colors });
							}
						} catch (e) {
							console.error('Failed to load initial colors:', e);
						}
						return;
					case 'applyColors':
						await applyColors(message.payload);
						// Ensure CyanoBact base theme is active
						await vscode.workspace.getConfiguration().update(
							'workbench.colorTheme',
							'Cyano Bact Theme',
							vscode.ConfigurationTarget.Global
						);
						vscode.window.showInformationMessage('CyanoBact Theme updated! 🎉');
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});

	context.subscriptions.push(disposable);
}

async function applyColors(payload: any) {
	try {
        console.log("CyanoBact Host: Received applyColors with payload:", payload);
        const config = vscode.workspace.getConfiguration();
        if (payload.workbench) {
            await config.update('workbench.colorCustomizations', payload.workbench, vscode.ConfigurationTarget.Global);
            console.log("Workbench colors updated.");
        }
        if (payload.tokens) {
            const tokenConfig = {
                "textMateRules": [
                    { "scope": "string", "settings": { "foreground": payload.tokens.string } },
                    { "scope": "comment", "settings": { "foreground": payload.tokens.comment } },
                    { "scope": "constant.numeric", "settings": { "foreground": payload.tokens.number } },
                    { "scope": "keyword", "settings": { "foreground": payload.tokens.keyword } },
                    { "scope": "entity.name.function", "settings": { "foreground": payload.tokens.function } }
                ]
            };
            await config.update('editor.tokenColorCustomizations', tokenConfig, vscode.ConfigurationTarget.Global);
            console.log("Token colors updated.");
        }
    } catch (e) {
        console.error("CyanoBact Host Error updating config:", e);
        vscode.window.showErrorMessage("Failed to apply theme config: " + e);
    }
}

export function deactivate() {}
