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
context('Check of the sign up and login functionality and the error messaging it is supposed to produce in some cases.', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000');
    });
it('Check of the sign up and login functionality and the error messaging it is supposed to produce in some cases.', () => {
        interface LanguageTexts {
            [key: string]: string;
        }

        const usTexts: LanguageTexts = us;

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

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', us.login_failed);

        cy.reload();

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="password_input_placeholder"]').type(
            Cypress.env('ownerPassword')
        );

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', us.login_failed);

        cy.reload();

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', us.login_failed);

        cy.reload();

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

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

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPassword
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', us.signup_failed);

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPassword
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');

        cy.get('[data-cy="button_for_dropdown_menu_for_signout"]').click();

        cy.get('[data-cy="signout_button"]').click();

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="login_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');

        cy.get('[data-cy="button_for_dropdown_menu_for_signout"]').click();

        cy.get('[data-cy="signout_button"]').click();

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            differentRandomPassword
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

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="password_input_placeholder"]').type(
            differentRandomPassword
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            differentRandomPassword
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
            differentRandomPassword
        );

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            differentRandomPassword
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.get('[data-cy="error"]').should('have.text', usTexts.signup_failed);

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

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

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPassword
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
            randomPassword
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
            randomPassword
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPassword
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('exist');

        cy.reload();

        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(
            differentRandomName
        );

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPassword
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');

        cy.get('[data-cy="button_for_dropdown_menu_for_signout"]').click();

        cy.get('[data-cy="signout_button"]').click();

        cy.get('[data-cy="welcome_p"]').should('exist');
    })
});
