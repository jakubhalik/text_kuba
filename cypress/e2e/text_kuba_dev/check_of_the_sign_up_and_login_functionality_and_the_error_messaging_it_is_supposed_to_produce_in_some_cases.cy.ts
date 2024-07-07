import { randomPassword, randomName } from "../../../lib/utils";
context('Check of the sign up and login functionality and the error messaging it is supposed to produce in some cases.', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000');
    });
it('Check of the sign up and login functionality and the error messaging it is supposed to produce in some cases.', () => {
        cy.get('[data-cy="switch_to_sign_up"]').click();

        cy.get('[data-cy="username_input_placeholder"]').type(randomName);

        cy.get('[data-cy="password_input_placeholder"]').type(randomPassword);

        cy.get('[data-cy="confirm_password_input_placeholder"]').type(
            randomPassword
        );

        cy.get('[data-cy="signup_button"]').click();

        cy.wait(1000);

        cy.get('[data-cy="welcome_p"]').should('not.exist');
    })
});
