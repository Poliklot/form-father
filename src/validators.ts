import { isUrlValid } from './helpers';

/* ---------- types ---------- */
export type ValidatorEffectCtx = {
	value: string;
	$input: ValidatorFieldElement;
	$form: HTMLElement;
	params?: any;
};

export type ValidatorFieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type ValidatorResult = {
	valid: boolean;
	/** Сообщение об ошибке, если нужно переопределить дефолт */
	message?: string;
	/** Выполнить сайд-эффект (подсветка, иконки, тексты и т.п.) */
	effect?: (ctx: ValidatorEffectCtx) => void | Promise<void>;
	/** Остановить дальнейшие правила для поля (даже если valid=true). Полезно, если валидатор полностью «ведёт» поле. */
	stopOthers?: boolean;
};

export type ValidatorFn = (
	value: string,
	$input: ValidatorFieldElement,
	$form: HTMLElement,
	params?: any,
) => boolean | ValidatorResult | Promise<boolean | ValidatorResult>;

interface Validator {
	fn: ValidatorFn;
	defaultMessage: string;
}

/* ---------- singleton-storage на globalThis ---------- */
const GLOBAL_KEY = Symbol.for('FormFather.validators');
const validators: Map<string, Validator> =
	(globalThis as any)[GLOBAL_KEY] ?? ((globalThis as any)[GLOBAL_KEY] = new Map<string, Validator>());

/* ---------- API ---------- */
export function registerValidator(
	name: string,
	fn: ValidatorFn,
	defaultMessage: string,
	{ override = false }: { override?: boolean } = {},
): void {
	if (validators.has(name) && !override) {
		console.warn(`[FormFather] Validator "${name}" already exists; pass { override: true } to replace`);
		return;
	}
	validators.set(name, { fn, defaultMessage });
}

export const getValidator = (name: string): Validator | undefined => validators.get(name);

export function getAllValidators(): Map<string, Validator> {
	return new Map(validators); // копию, чтобы никто не мутировал оригинал
}

/* ---------- built-in rules ---------- */
function registerBuiltinValidator(name: string, fn: ValidatorFn, defaultMessage: string): void {
	if (!validators.has(name)) {
		validators.set(name, { fn, defaultMessage });
	}
}

registerBuiltinValidator(
	'required',
	(value, $input, $form) => {
		if ($input && $input.type) {
			if ($input.type === 'checkbox') {
				return ($input as HTMLInputElement).checked;
			}
			if ($input.type === 'radio') {
				const group = $form.querySelectorAll(`input[type="radio"][name="${$input.name}"]`);
				return Array.from(group).some(el => (el as HTMLInputElement).checked);
			}
		}

		// fallback — если нет $input (например, в unit-тестах)
		return value.trim().length > 0;
	},
	'Пустое значение',
);

registerBuiltinValidator('email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Неверный формат');

registerBuiltinValidator('tel', v => /^\+7\d{10}$/.test(v), 'Неверный формат');

registerBuiltinValidator('url', v => isUrlValid(v), 'Неверный формат');

registerBuiltinValidator('not-numbers', v => !/[0-9]/.test(v), 'Неверный формат');
