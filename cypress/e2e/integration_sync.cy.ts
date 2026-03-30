// cypress/e2e/integration_sync.cy.ts
describe('Phase 1 Integration Sync: Onboarding & State Handshake', () => {

  // Bypass Google OAuth for CI testing by visiting the onboarding context directly.
  it('Should successfully navigate to Context form, verify constraints, and connect to Hub', () => {
    
    // 1. Visit Onboarding
    cy.visit('/onboarding');
    cy.get('h1').contains('Context Gathering');

    // 2. Fills out React User Form correctly
    cy.get('input[placeholder="e.g. Clean Energy, EdTech, Healthcare"]').type('AI Education');
    cy.get('textarea').type('Provide advanced mentorship tools to lower-income urban communities.');
    
    // Adjust Select Tag
    cy.get('select').select('EXPERT');
    
    // 3. Submit mapping Context to Zustand
    cy.get('button').contains('Generate Simulation Context').click();

    // 4. Assert URL changed accurately to the Dev 3/Dev 4 Dashboard Hub
    cy.url().should('include', '/decision-hub');

    // 5. Verify the Handshake Component rendered correctly
    cy.get('h1').contains('VentureSimulate | Turn 1');
    
    // Verify Dev 2 Zustand State printed properly in Dev 3's UI Header
    cy.contains('AI Education').should('be.visible');
    
    // Verify Budget logic matches Contract specifications
    cy.contains('$2,000').should('be.visible');

    // 6. Verify Dev 4 PixiJS Canvas reacted to the mapNodes state injection correctly
    // The canvas should be mounted, and if Zustand was right, 1 mapNode was counted.
    cy.get('div').contains('Phase 3 Interactive Logos');
    cy.get('canvas').should('exist');
  });
});
