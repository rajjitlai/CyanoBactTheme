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
					case 'applyColors':
						await applyColors(message.colors);
						vscode.window.showInformationMessage('CyanoBact Theme updated successfully! 🎉');
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});

	context.subscriptions.push(disposable);
}

async function applyColors(colors: any) {
	const config = vscode.workspace.getConfiguration();
	await config.update('workbench.colorCustomizations', colors, vscode.ConfigurationTarget.Global);
}

export function deactivate() {}
