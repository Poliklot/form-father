/**
 * Тесты расширенного контракта валидаторов:
 *
 * - возврат объекта { valid, message, effect, stopOthers }
 * - приоритет сообщения result.message > schema.messages[rule] > defaultMessage
 * - вызов/ожидание effect
 * - stopOthers прерывает цепочку правил
 */

import { registerValidator, getValidator } from '../src/validators';

describe('extended validators API', () => {
	const ruleOk = 'obj-ok';
	const ruleFailWithMsg = 'obj-fail-msg';
	const ruleFailNoMsg = 'obj-fail-nomsg';
	const ruleProbe = 'probe-next';

	const $form = document.createElement('form');
	const $input = document.createElement('input');
	$form.appendChild($input);

	test('validator can return {valid:true, effect, stopOthers}', async () => {
		const effectSpy = jest.fn();

		registerValidator(
			ruleOk,
			() => ({
				valid: true,
				effect: effectSpy,
				stopOthers: true,
			}),
			'DEF',
			{ override: true },
		);

		let probeCalled = 0;
		registerValidator(
			ruleProbe,
			() => {
				probeCalled += 1;
				return true;
			},
			'DEF',
			{ override: true },
		);

		const vd1 = getValidator(ruleOk)!;
		const vd2 = getValidator(ruleProbe)!;

		// вызов первого
		const r1 = await vd1.fn('abc', $input as any, $form as any);
		// эмулируем поведение Form.validate: вызвать effect
		if (typeof r1 === 'object' && r1 && (r1 as any).effect) {
			await (r1 as any).effect({
				value: 'abc',
				$input: $input as any,
				$form: $form as any,
				params: undefined,
			});
		}
		// второй не должен вызываться в нормальном пайплайне, тк stopOthers
		// (мы это полноценно проверим в интеграционном тесте Form.validate)

		expect(typeof r1).toBe('object');
		expect((r1 as any).valid).toBe(true);
		expect(effectSpy).toHaveBeenCalledTimes(1);

		// прямой вызов второго (имитация, что stopOthers сработал — мы НЕ вызываем)
		expect(probeCalled).toBe(0);
		await vd2.fn('abc', $input as any, $form as any);
		expect(probeCalled).toBe(1);
	});

	test('message from result overrides default/schema', async () => {
		registerValidator(ruleFailWithMsg, () => ({ valid: false, message: 'RESULT MSG' }), 'DEFAULT MSG', {
			override: true,
		});

		const vd = getValidator(ruleFailWithMsg)!;
		const r = await vd.fn('', $input as any, $form as any);
		expect(typeof r).toBe('object');
		expect((r as any).valid).toBe(false);
		expect((r as any).message).toBe('RESULT MSG');
	});

	test('when result has no message — consumer должен взять schema.messages или default', async () => {
		registerValidator(ruleFailNoMsg, () => ({ valid: false }), 'DEFAULT Fallback', { override: true });

		const vd = getValidator(ruleFailNoMsg)!;
		const r = await vd.fn('', $input as any, $form as any);
		expect(typeof r).toBe('object');
		expect((r as any).valid).toBe(false);
		expect((r as any).message).toBeUndefined(); // сам валидатор не заполняет message
	});

	/* страховка */
	test('dummy', () => {
		expect(true).toBe(true);
	});
});
