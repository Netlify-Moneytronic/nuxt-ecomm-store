describe('Home Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/');
  });

  it('should display the hero banner', () => {
    cy.get('section').first().should('be.visible');
  });

  it('should display the product carousel', () => {
    cy.contains('BEST SELLERS').should('be.visible');
  });

  it('should have working navigation links', () => {
    cy.get('a[role="button"]').should('have.length.at.least', 1);
  });

  it('should display discount modal for new visitors', () => {
    cy.get('[data-test="discount-modal"]').should('be.visible');
  });

  it('should close discount modal when close button is clicked', () => {
    cy.get('button[aria-label="Close discount modal"]').click();
    cy.get('[data-test="discount-modal"]').should('not.exist');
  });
});
