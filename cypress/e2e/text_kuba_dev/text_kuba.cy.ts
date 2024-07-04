import { owner } from '../../../postgresConfig';
import us from '../../../lang_us.json';
import cz from '../../../lang_cz.json';
import { randomPassword, randomName } from '../../../lib/utils';

interface LanguageTexts {
    [key: string]: string;
}

const usTexts: LanguageTexts = us;
const czTexts: LanguageTexts = cz;

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

    it(`Check of the sign up and login functionality and it's error messaging.`, () => {
        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPassword
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');
    });

    it('Full check of the english language texts on the app.', () => {
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

        ['confirm_password_placeholder'].forEach((key) => {
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

        ['confirm_password_placeholder'].forEach((key) => {
            cy.wait(1000);
            cy.get(`[data-cy=${key}]`).should(
                'have.attr',
                'placeholder',
                usTexts[key as keyof typeof usTexts]
            );
        });

        ['confirm_password_placeholder'].forEach((key) => {
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
