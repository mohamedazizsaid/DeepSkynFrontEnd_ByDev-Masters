import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddressMapPicker } from './address-map-picker';

describe('AddressMapPicker', () => {
  it('renders the search input', () => {
    render(<AddressMapPicker onAddressSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText('Rechercher une adresse...')).toBeInTheDocument();
  });
});
