import { Laptop, Moon, Sun } from "lucide-react";
import { themeOptions, useTheme } from "./theme-context";

const themeIcons = {
	light: Sun,
	dark: Moon,
	system: Laptop,
};

const Header = () => {
	const { theme, setTheme } = useTheme();

	return (
		<header className="flex items-center justify-end border-b border-border px-4 py-3 sm:px-6">
			<div
				aria-label="Choisir le thème"
				className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1"
				role="group"
			>
				{themeOptions.map(({ value, label }) => {
					const Icon = themeIcons[value];

					return (
						<button
							aria-label={`Thème ${label.toLowerCase()}`}
							aria-pressed={theme === value}
							className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
							key={value}
							onClick={() => setTheme(value)}
							title={label}
							type="button"
						>
							<Icon aria-hidden="true" className="size-4" />
						</button>
					);
				})}
			</div>
		</header>
	);
};

export default Header;
