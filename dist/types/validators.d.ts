export type ValidatorEffectCtx = {
    value: string;
    $input: HTMLInputElement | HTMLTextAreaElement;
    $form: HTMLElement;
    params?: any;
};
export type ValidatorResult = {
    valid: boolean;
    /** Сообщение об ошибке, если нужно переопределить дефолт */
    message?: string;
    /** Выполнить сайд-эффект (подсветка, иконки, тексты и т.п.) */
    effect?: (ctx: ValidatorEffectCtx) => void | Promise<void>;
    /** Остановить дальнейшие правила для поля (даже если valid=true). Полезно, если валидатор полностью «ведёт» поле. */
    stopOthers?: boolean;
};
type ValidatorFn = (value: string, $input: HTMLInputElement | HTMLTextAreaElement, $form: HTMLElement, params?: any) => boolean | Promise<boolean> | ValidatorResult | Promise<ValidatorResult>;
interface Validator {
    fn: ValidatorFn;
    defaultMessage: string;
}
export declare function registerValidator(name: string, fn: ValidatorFn, defaultMessage: string, { override }?: {
    override?: boolean;
}): void;
export declare const getValidator: (name: string) => Validator | undefined;
export declare function getAllValidators(): Map<string, Validator>;
export {};
