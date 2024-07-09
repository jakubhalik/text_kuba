import { owner } from "../../../postgresConfig";
import {
    randomPassword,
    randomName,
    differentRandomPassword,
    randomNameTwo,
    randomPasswordTwo,
    differentRandomPasswordTwo,
    differentRandomName,
    differentRandomNameTwo,
} from "../../../lib/utils";
import us from "../../../lang_us.json";
context('Full check of the english language texts on the app.', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000');
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
        //

        cy.reload();

        cy.get('[data-cy="username_input_placeholder"]').type(
            Cypress.env('owner')
        );

        cy.get('[data-cy="password_input_placeholder"]').type(
            Cypress.env('ownerPassword')
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');

        cy.get('[data-cy="button_for_dropdown_menu_for_signout"]').click();

        cy.get('[data-cy="signout_button"]').click();

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="username_input_placeholder"]').type(
            Cypress.env('owner')
        );

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', us.login_failed);

        cy.reload();

        cy.get('[data-cy="username_input_placeholder"]').type(randomNameTwo);

        cy.get('[data-cy="password_input_placeholder"]').type(
            Cypress.env('ownerPassword')
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', us.login_failed);

        cy.reload();

        cy.get('[data-cy="username_input_placeholder"]').type(randomNameTwo);

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', us.login_failed);

        cy.reload();

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="username_input_placeholder"]').type(randomNameTwo);

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="username_input_placeholder"]').type(
            Cypress.env('owner')
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="password_input_placeholder"]').type(
            Cypress.env('ownerPassword')
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(
            Cypress.env('owner')
        );

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', us.signup_failed);

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomNameTwo);

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');

        cy.get('[data-cy="button_for_dropdown_menu_for_signout"]').click();

        cy.get('[data-cy="signout_button"]').click();

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="username_input_placeholder"]').type(randomNameTwo);

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');

        cy.get('[data-cy="button_for_dropdown_menu_for_signout"]').click();

        cy.get('[data-cy="signout_button"]').click();

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomNameTwo);

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            differentRandomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should(
            'have.text',
            usTexts.password_mismatch
        );

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomNameTwo);

        cy.get('[data-cy="password_input_placeholder"]').type(
            differentRandomPasswordTwo
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            differentRandomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', usTexts.signup_failed);

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(
            Cypress.env('owner')
        );

        cy.get('[data-cy="password_input_placeholder"]').type(
            differentRandomPasswordTwo
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            differentRandomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', usTexts.signup_failed);

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomNameTwo);

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(
            Cypress.env('owner')
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="password_input_placeholder"]').type(
            Cypress.env('ownerPassword')
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(
            Cypress.env('owner')
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="password_input_placeholder"]').type(
            Cypress.env('ownerPassword')
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(
            differentRandomNameTwo
        );

        cy.get('[data-cy="password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPasswordTwo
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');

        cy.get('[data-cy="button_for_dropdown_menu_for_signout"]').click();

        cy.get('[data-cy="signout_button"]').click();

        cy.get('[data-cy="welcome_p"]').should('exist');
    })
});
