import { owner } from '../../../postgresConfig';
import us from '../../../lang_us.json';
import cz from '../../../lang_cz.json';

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
});
