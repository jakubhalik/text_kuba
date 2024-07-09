import { owner } from '../../../postgresConfig';
import us from '../../../lang_us.json';
import cz from '../../../lang_cz.json';
import {
    randomPassword,
    randomName,
    differentRandomPassword,
} from '../../../lib/utils';

context(`E2E test of all of text_${owner} app functionality`, () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000');
    });

    it('Check if the theme switching and giving system theme by default works correctly.', () => {
        cy.window().then((win) => {
            const isSystemDark = win.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            cy.get('html').should(
                'have.class',
                isSystemDark ? 'dark' : 'light'
            );
        });

        cy.get('[data-cy="button_for_dropdown_menu_for_theme_toggle"]').click();
        cy.get(
            '[data-cy="dark_theme_button_in_the_dropdown_menu_for_theme_toggle"]'
        ).click();
        cy.get('html').should('have.class', 'dark');

        cy.wait(1000);

        cy.get('[data-cy="button_for_dropdown_menu_for_theme_toggle"]').click();
        cy.get(
            '[data-cy="light_theme_button_in_the_dropdown_menu_for_theme_toggle"]'
        ).click();
        cy.get('html').should('have.class', 'light');

        cy.wait(1000);

        cy.get('[data-cy="button_for_dropdown_menu_for_theme_toggle"]').click();
        cy.get(
            '[data-cy="system_theme_button_in_the_dropdown_menu_for_theme_toggle"]'
        ).click();
        cy.window().then((win) => {
            const isSystemDark = win.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            cy.get('html').should(
                'have.class',
                isSystemDark ? 'dark' : 'light'
            );
        });
    });

    it('Basic check of lang switching.', () => {
        cy.get('[data-cy="button_for_dropdown_menu_for_lang_toggle"]').click();
        cy.wait(1000);
        cy.get(
            '[data-cy="cz_button_in_the_dropdown_menu_for_lang_toggle"]'
        ).click();
        cy.get('[data-cy="welcome_p"]').should('have.text', `${cz.welcome_p}`);

        cy.wait(1000);

        cy.get('[data-cy="button_for_dropdown_menu_for_lang_toggle"]').click();
        cy.wait(1000);
        cy.get(
            '[data-cy="us_button_in_the_dropdown_menu_for_lang_toggle"]'
        ).click();
        cy.get('[data-cy="welcome_p"]').should('have.text', `${us.welcome_p}`);
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
    });

    it('Full check of the english language texts on the app.', () => {
        interface LanguageTexts {
            [key: string]: string;
        }

        const usTexts: LanguageTexts = us;

        cy.get('[data-cy="button_for_dropdown_menu_for_lang_toggle"]').click();
        cy.wait(1000);
        cy.get(
            '[data-cy="us_button_in_the_dropdown_menu_for_lang_toggle"]'
        ).click();

        [
            'login_h',
            'welcome_p',
            'deploy_link',
            'username_label',
            'password_label',
            'login_button',
        ].forEach((key) => {
            cy.get(`[data-cy=${key}]`).should(
                'have.text',
                usTexts[key as keyof LanguageTexts]
            );
        });

        ['dont_have_account'].forEach((key) => {
            cy.get(`[data-cy=${key}]`).should(
                'have.text',
                usTexts[key as keyof LanguageTexts] +
                usTexts['switch_to_sign_up']
            );
        });

        ['username_input_placeholder', 'password_input_placeholder'].forEach(
            (key) => {
                cy.get(`[data-cy=${key}]`).should('exist').and('be.visible');
                cy.get(`[data-cy=${key}]`)
                    .invoke('attr', 'placeholder')
                    .then((placeholder) => {
                        console.log(
                            `Expected: 
                                ${usTexts[key as keyof typeof usTexts]
                            }, Actual: ${placeholder}`
                        );
                        expect(placeholder).to.equal(
                            usTexts[key as keyof typeof usTexts]
                        );
                    });
            }
        );

        ['username_input_placeholder', 'password_input_placeholder'].forEach(
            (key) => {
                cy.wait(1000);
                cy.get(`[data-cy=${key}]`).should(
                    'have.attr',
                    'placeholder',
                    usTexts[key as keyof typeof usTexts]
                );
            }
        );

        ['username_input_placeholder', 'password_input_placeholder'].forEach(
            (key) => {
                cy.get(`[data-cy=${key}]`).should(
                    'have.attr',
                    'placeholder',
                    usTexts[key as keyof LanguageTexts]
                );
            }
        );

        cy.get('[data-cy="switch_to_sign_up"]').click();

        [
            'signup_h',
            'confirm_password_label',
            'signup_information',
            'signup_button',
        ].forEach((key) => {
            cy.get(`[data-cy=${key}]`).should(
                'have.text',
                usTexts[key as keyof LanguageTexts]
            );
        });

        ['have_account'].forEach((key) => {
            cy.get(`[data-cy=${key}]`).should(
                'have.text',
                usTexts[key as keyof LanguageTexts] + usTexts['switch_to_login']
            );
        });

        ['confirm_password_input_placeholder'].forEach((key) => {
            cy.get(`[data-cy=${key}]`).should('exist').and('be.visible');
            cy.get(`[data-cy=${key}]`)
                .invoke('attr', 'placeholder')
                .then((placeholder) => {
                    console.log(
                        `Expected: 
                                ${usTexts[key as keyof typeof usTexts]
                        }, Actual: ${placeholder}`
                    );
                    expect(placeholder).to.equal(
                        usTexts[key as keyof typeof usTexts]
                    );
                });
        });

        ['confirm_password_input_placeholder'].forEach((key) => {
            cy.wait(1000);
            cy.get(`[data-cy=${key}]`).should(
                'have.attr',
                'placeholder',
                usTexts[key as keyof typeof usTexts]
            );
        });

        ['confirm_password_input_placeholder'].forEach((key) => {
            cy.get(`[data-cy=${key}]`).should(
                'have.attr',
                'placeholder',
                usTexts[key as keyof LanguageTexts]
            );
        });

        // Object.keys(us).forEach((key) => {
        //     cy.get(`[data-cy=${key}]`).should(
        //         'have.text',
        //         usTexts[key as keyof LanguageTexts]
        //     );
        // });
    });
});
