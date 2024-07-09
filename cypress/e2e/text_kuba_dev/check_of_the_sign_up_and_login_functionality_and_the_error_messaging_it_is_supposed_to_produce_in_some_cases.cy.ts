import {
    randomPassword,
    randomName,
    differentRandomPassword,
} from "../../../lib/utils";
import us from "../../../lang_us.json";
import { owner } from "../../../postgresConfig";
context('Check of the sign up and login functionality and the error messaging it is supposed to produce in some cases.', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000');
    });
it('Check of the sign up and login functionality and the error messaging it is supposed to produce in some cases.', () => {
        const usTexts = us;

        interface Action {
            type: 'type' | 'click' | 'wait';
            element?: string;
            value?: string | number;
        }

        interface Test {
            description: string;
            actions: Action[];
            assertion: {
                element: string;
                should: 'exist' | 'not.exist' | 'have.text';
                value?: string;
            };
        }

        const tests: Test[] = [
            {
                description: 'Valid login and logout',
                actions: [
                    {
                        type: 'type',
                        element: '[data-cy="username_input_placeholder"]',
                        value: Cypress.env('owner'),
                    },
                    {
                        type: 'type',
                        element: '[data-cy="password_input_placeholder"]',
                        value: Cypress.env('ownerPassword'),
                    },
                    { type: 'click', element: '[data-cy="login_button"]' },
                    { type: 'wait', value: 1000 },
                    {
                        type: 'click',
                        element:
                            '[data-cy="button_for_dropdown_menu_for_signout"]',
                    },
                    { type: 'click', element: '[data-cy="signout_button"]' },
                ],
                assertion: {
                    element: '[data-cy="welcome_p"]',
                    should: 'exist',
                },
            },
            {
                description: 'Invalid login with wrong password',
                actions: [
                    {
                        type: 'type',
                        element: '[data-cy="username_input_placeholder"]',
                        value: Cypress.env('owner'),
                    },
                    {
                        type: 'type',
                        element: '[data-cy="password_input_placeholder"]',
                        value: randomPassword,
                    },
                    { type: 'click', element: '[data-cy="login_button"]' },
                    { type: 'wait', value: 1000 },
                ],
                assertion: {
                    element: '[data-cy="error"]',
                    should: 'have.text',
                    value: us.login_failed,
                },
            },
            {
                description: 'Invalid login with wrong username',
                actions: [
                    {
                        type: 'type',
                        element: '[data-cy="username_input_placeholder"]',
                        value: randomName,
                    },
                    {
                        type: 'type',
                        element: '[data-cy="password_input_placeholder"]',
                        value: Cypress.env('ownerPassword'),
                    },
                    { type: 'click', element: '[data-cy="login_button"]' },
                    { type: 'wait', value: 1000 },
                ],
                assertion: {
                    element: '[data-cy="error"]',
                    should: 'have.text',
                    value: us.login_failed,
                },
            },
            {
                description: 'Sign up with existing username',
                actions: [
                    { type: 'click', element: '[data-cy="switch_to_sign_up"]' },
                    {
                        type: 'type',
                        element: '[data-cy="username_input_placeholder"]',
                        value: Cypress.env('owner'),
                    },
                    {
                        type: 'type',
                        element: '[data-cy="password_input_placeholder"]',
                        value: randomPassword,
                    },
                    {
                        type: 'type',
                        element:
                            '[data-cy="confirm_password_input_placeholder"]',
                        value: randomPassword,
                    },
                    { type: 'click', element: '[data-cy="signup_button"]' },
                    { type: 'wait', value: 1000 },
                ],
                assertion: {
                    element: '[data-cy="error"]',
                    should: 'have.text',
                    value: us.signup_failed,
                },
            },
            {
                description: 'Sign up with mismatched passwords',
                actions: [
                    { type: 'click', element: '[data-cy="switch_to_sign_up"]' },
                    {
                        type: 'type',
                        element: '[data-cy="username_input_placeholder"]',
                        value: randomName,
                    },
                    {
                        type: 'type',
                        element: '[data-cy="password_input_placeholder"]',
                        value: randomPassword,
                    },
                    {
                        type: 'type',
                        element:
                            '[data-cy="confirm_password_input_placeholder"]',
                        value: differentRandomPassword,
                    },
                    { type: 'click', element: '[data-cy="signup_button"]' },
                    { type: 'wait', value: 1000 },
                ],
                assertion: {
                    element: '[data-cy="error"]',
                    should: 'have.text',
                    value: usTexts.password_mismatch,
                },
            },
            {
                description: 'Sign up with valid credentials',
                actions: [
                    { type: 'click', element: '[data-cy="switch_to_sign_up"]' },
                    {
                        type: 'type',
                        element: '[data-cy="username_input_placeholder"]',
                        value: randomName,
                    },
                    {
                        type: 'type',
                        element: '[data-cy="password_input_placeholder"]',
                        value: differentRandomPassword,
                    },
                    {
                        type: 'type',
                        element:
                            '[data-cy="confirm_password_input_placeholder"]',
                        value: differentRandomPassword,
                    },
                    { type: 'click', element: '[data-cy="signup_button"]' },
                    { type: 'wait', value: 1000 },
                ],
                assertion: {
                    element: '[data-cy="error"]',
                    should: 'have.text',
                    value: usTexts.signup_failed,
                },
            },
        ];

        tests.forEach((test) => {
            it(test.description, () => {
                test.actions.forEach((action) => {
                    if (
                        action.type === 'type' &&
                        action.element &&
                        action.value
                    ) {
                        cy.get(action.element).type(action.value as string);
                    } else if (action.type === 'click' && action.element) {
                        cy.get(action.element).click();
                    } else if (
                        action.type === 'wait' &&
                        typeof action.value === 'number'
                    ) {
                        cy.wait(action.value);
                    }
                });

                if (test.assertion.value) {
                    cy.get(test.assertion.element).should(
                        test.assertion.should,
                        test.assertion.value
                    );
                } else {
                    cy.get(test.assertion.element).should(
                        test.assertion.should
                    );
                }
                cy.reload();
            });
        });
    })
});
