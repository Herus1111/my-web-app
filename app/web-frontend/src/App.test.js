import { render, screen } from '@testing-library/react';
import App from './App';

test('rendert die App-Shell mit Sidebar-Navigation', () => {
  render(<App />);
  // Registrierungs-CTA aus dem Sidebar-Footer
  expect(screen.getByText(/Jetzt registrieren/i)).toBeInTheDocument();
  // Ein Navigationspunkt der Sidebar
  expect(screen.getByText(/Event-Graph/i)).toBeInTheDocument();
});
