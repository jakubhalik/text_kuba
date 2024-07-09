import us from "../../../lang_us.json";
import cz from "../../../lang_cz.json";
context('Basic check of lang switching.', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000');
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
    })
});
