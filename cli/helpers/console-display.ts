class ConsoleDisplay {
	readonly icons = {
		// Status
		success: ' ✅',
		error: ' ❌',
		warning: ' ⚠️',
		info: ' ℹ️',
		tip: ' 💡',
		note: ' 📝',

		// Entity
		folder: ' 📁',
		file: ' 📄 ',
		database: ' 🗄️',
		user: ' 👤',
		gear: ' ⚙️',
		lock: ' 🔒',
		trash: ' 🗑️',
		star: ' ⭐',
		loading: ' 🔄',

		// Symbol
		arrow: '→',
		check: '✓',
		cross: '✗',
		bullet: '•',

		// Additional
		download: ' ⬇️ ',
		upload: ' ⬆️ ',
		refresh: ' 🔄 ',
		search: ' 🔍 ',
		clock: ' ⏰ ',
		flag: ' 🚩 ',
		rocket: ' 🚀 ',
		fire: ' 🔥 ',
	};

	private currentIndent = 0;

	// Set the indentation value
	indent(value: number): this {
		this.currentIndent = Math.max(0, value);
		return this;
	}

	// Increase indentation
	indentMore(value: number = 2): this {
		this.currentIndent += value;
		return this;
	}

	// Decrease indentation
	indentLess(value: number = 2): this {
		this.currentIndent = Math.max(0, this.currentIndent - value);
		return this;
	}

	// Reset indentation
	indentReset(): this {
		this.currentIndent = 0;
		return this;
	}

	private getIndent(): string {
		return ' '.repeat(this.currentIndent);
	}

	text(message: string, type: string = 'default') {
		const indent = this.getIndent();

		switch (type) {
			case 'headline':
				console.debug(`${indent}${'═'.repeat(50)}`);
				console.debug(`${indent}  ${message.toUpperCase()}`);
				console.debug(`${indent}${'═'.repeat(50)}`);
				break;

			case 'subheadline':
				console.debug(`${indent}${'─'.repeat(message.length + 4)}`);
				console.debug(`${indent}  ${message}`);
				console.debug(`${indent}${'─'.repeat(message.length + 4)}`);
				break;

			case 'error':
				console.error(`${indent}${this.icons.error} ${message}`);
				break;

			case 'default':
				console.debug(`${indent}${message}`);
				break;

			default: {
				type IconType = keyof typeof this.icons;

				const iconToUse =
					this.icons[type as IconType] ?? 'icon_not_found';
				console.debug(`${indent}${iconToUse} ${message}`);
				break;
			}
		}

		return this;
	}

	// Convenience methods
	success(message: string): this {
		return this.text(message, 'success');
	}

	error(message: string): this {
		return this.text(message, 'error');
	}

	warning(message: string): this {
		return this.text(message, 'warning');
	}

	info(message: string): this {
		return this.text(message, 'info');
	}

	tip(message: string): this {
		return this.text(message, 'tip');
	}

	note(message: string): this {
		return this.text(message, 'note');
	}

	bullet(message: string): this {
		return this.text(message, 'bullet');
	}

	// Progress indicator
	progress(current: number, total: number, message: string): this {
		const percent = Math.round((current / total) * 100);
		const barLength = 30;
		const filled = Math.round((percent / 100) * barLength);
		const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

		process.stdout.write(
			`\r${this.getIndent()}[${bar}] ${percent}% ${message}`,
		);

		if (current === total) {
			process.stdout.write('\n');
		}

		return this;
	}

	private spinnerInterval: NodeJS.Timeout | null = null;
	private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
	private spinnerIndent = this.currentIndent;

	startSpinner(message: string): this {
		// Store current indentation when the spinner starts
		const indentStr = ' '.repeat(this.spinnerIndent);

		let i = 0;
		this.spinnerInterval = setInterval(() => {
			process.stdout.write(
				`\r${indentStr}${this.spinnerFrames[i]} ${message}`,
			);
			i = (i + 1) % this.spinnerFrames.length;
		}, 80);
		return this;
	}

	stopSpinner(success: boolean = true, finalMessage: string = ''): this {
		if (this.spinnerInterval) {
			clearInterval(this.spinnerInterval);
			this.spinnerInterval = null;

			const icon = success ? this.icons.success : this.icons.error;
			const indentStr = ' '.repeat(this.spinnerIndent);

			// Clear the entire line first
			process.stdout.write('\r\x1b[2K'); // \x1b[2K clears the entire line

			// Write the final message
			process.stdout.write(`${indentStr}${icon} ${finalMessage}\n`);
		}
		return this;
	}

	async withDots(
		initMessage: string,
		task: () => Promise<string>,
	): Promise<void> {
		const indentStr = ' '.repeat(this.currentIndent);
		let dotCount = 0;
		let dotsActive = true;

		// Start dots animation
		const interval = setInterval(() => {
			if (!dotsActive) {
				return;
			}

			dotCount = (dotCount + 1) % 4;
			const dots = '.'.repeat(dotCount);
			const spaces = ' '.repeat(3 - dotCount);

			process.stdout.write(
				`\r\x1b[K${indentStr}${initMessage}${dots}${spaces}`,
			);
		}, 300);

		try {
			const successMessage = await task();

			dotsActive = false;
			clearInterval(interval);

			process.stdout.write(
				`\r\x1b[2K${indentStr}${this.icons.success} ${successMessage}\n`,
			);
		} catch (error) {
			dotsActive = false;
			clearInterval(interval);

			const message =
				error instanceof Error ? error.message : 'Unknown error';

			process.stdout.write(
				`\r\x1b[2K${indentStr}${this.icons.error} ${message}\n`,
			);

			throw error;
		}
	}

	// Table display
	table(data: Record<string, string>[], columns?: string[]): this {
		if (data.length === 0) {
			this.text('No data to display', 'info');
			return this;
		}

		const allColumns = columns || Object.keys(data[0]);
		const columnWidths: Record<string, number> = {};

		// Calculate column widths
		allColumns.forEach((col) => {
			columnWidths[col] = Math.max(
				col.length,
				...data.map((row) => String(row[col] || '').length),
			);
		});

		// Print header
		const header = allColumns
			.map((col) => col.toUpperCase().padEnd(columnWidths[col]))
			.join(' │ ');

		console.debug(`\n${this.getIndent()}${header}`);
		console.debug(`${this.getIndent()}${'─'.repeat(header.length)}`);

		// Print rows
		data.forEach((row) => {
			const rowStr = allColumns
				.map((col) => String(row[col] || '').padEnd(columnWidths[col]))
				.join(' │ ');
			console.debug(`${this.getIndent()}${rowStr}`);
		});

		console.debug();
		return this;
	}

	// Divider line
	divider(length: number = 50, char: string = '─'): this {
		console.debug(`${this.getIndent()}${char.repeat(length)}`);
		return this;
	}

	// JSON pretty print
	json(data: Record<string, string>, label?: string): this {
		if (label) {
			this.text(label, 'info');
		}

		console.debug(`${this.getIndent()}${JSON.stringify(data, null, 2)}`);
		return this;
	}

	// Clear the last line
	clearLast(): this {
		process.stdout.write('\r\x1b[K');
		return this;
	}

	// Blank line
	blank(lines: number = 1): this {
		for (let i = 0; i < lines; i++) {
			console.debug();
		}
		return this;
	}
}

export const display = new ConsoleDisplay();

// // Basic usage
// display.text('Starting process...', 'headline')
//     .text('Checking prerequisites...', 'info')
//     .indentMore()
//     .list('Database connection')
//     .list('File permissions')
//     .list('Dependencies')
//     .indentLess()
//     .divider()
//     .text('All checks passed!', 'success')
//     .blank();
//
// // With progress
// for (let i = 1; i <= 10; i++) {
//     display.progress(i, 10, 'Processing files');
//     await new Promise(resolve => setTimeout(resolve, 100));
// }
// display.blank();
//
// // With spinner
// display.startSpinner('Installing package...');
// await new Promise(resolve => setTimeout(resolve, 2000));
// display.stopSpinner(true, 'Package installed successfully!');
//
// // Table display
// display.table([
//     { id: 1, name: 'Feature A', status: 'Active' },
//     { id: 2, name: 'Feature B', status: 'Inactive' },
//     { id: 3, name: 'Feature C', status: 'Active' }
// ], ['id', 'name', 'status']);
