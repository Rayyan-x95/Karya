import { ProjectStateMachine, InvoiceStateMachine, PaymentStateMachine } from './utils/StateMachine';

function testProjectStateMachine() {
  console.log('Testing Project State Machine...');
  
  // Valid transitions
  const t1 = ProjectStateMachine.validate('lead', 'proposal');
  if (!t1) throw new Error('lead -> proposal should be valid');

  const t2 = ProjectStateMachine.validate('contract_signed', 'in_progress');
  if (!t2) throw new Error('contract_signed -> in_progress should be valid');

  // Invalid transition
  const t3 = ProjectStateMachine.validate('lead', 'paid');
  if (t3) throw new Error('lead -> paid should be invalid');

  console.log('✓ Project State Machine transitions verified');
}

function testInvoiceStateMachine() {
  console.log('Testing Invoice State Machine...');

  // Valid transitions
  const t1 = InvoiceStateMachine.validate('draft', 'sent');
  if (!t1) throw new Error('draft -> sent should be valid');

  const t2 = InvoiceStateMachine.validate('sent', 'pending_verification');
  if (!t2) throw new Error('sent -> pending_verification should be valid');

  // Invalid transition
  const t3 = InvoiceStateMachine.validate('draft', 'paid');
  if (t3) throw new Error('draft -> paid should be invalid');

  console.log('✓ Invoice State Machine transitions verified');
}

function testPaymentStateMachine() {
  console.log('Testing Payment State Machine...');

  // Valid transitions
  const t1 = PaymentStateMachine.validate('pending', 'completed');
  if (!t1) throw new Error('pending -> completed should be valid');

  const t2 = PaymentStateMachine.validate('pending', 'failed');
  if (!t2) throw new Error('pending -> failed should be valid');

  // Invalid transition
  const t3 = PaymentStateMachine.validate('completed', 'failed');
  if (t3) throw new Error('completed -> failed should be invalid');

  console.log('✓ Payment State Machine transitions verified');
}

try {
  testProjectStateMachine();
  testInvoiceStateMachine();
  testPaymentStateMachine();
  console.log('\n=======================================');
  console.log('ALL STATE MACHINE TRANSITION PATHS OK!');
  console.log('=======================================');
} catch (e: any) {
  console.error('Test Failed:', e.message);
  throw e;
}
