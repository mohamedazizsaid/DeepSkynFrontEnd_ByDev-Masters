import apiClient from '../api-client';

export interface AddressData {
  address: string;
  city: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface UserAddressResponse {
  id: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

class AddressService {
  /**
   * Récupère l'adresse actuelle de l'utilisateur
   */
  async getUserAddress(): Promise<UserAddressResponse> {
    try {
      const response = await apiClient.get('/auth/address');
      return response.data;
    } catch (error) {
      console.error('Error fetching user address:', error);
      throw error;
    }
  }

  /**
   * Met à jour l'adresse de l'utilisateur
   */
  async updateUserAddress(
    addressData: AddressData
  ): Promise<UserAddressResponse> {
    try {
      const response = await apiClient.post('/auth/address', {
        address: addressData.address,
        city: addressData.city,
        zipCode: addressData.zipCode,
        country: addressData.country,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user address:', error);
      throw error;
    }
  }

  /**
   * Supprime l'adresse de l'utilisateur
   */
  async deleteUserAddress(): Promise<void> {
    try {
      await apiClient.delete('/auth/address');
    } catch (error) {
      console.error('Error deleting user address:', error);
      throw error;
    }
  }

  /**
   * Reverse geocoding - obtient l'adresse à partir des coordonnées
   */
  async reverseGeocode(lat: number, lon: number): Promise<AddressData | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      const address = data.address || {};

      return {
        address: data.display_name,
        city: address.city || address.town || address.village || '',
        zipCode: address.postcode || '',
        country: address.country || '',
        latitude: lat,
        longitude: lon,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Forward geocoding - obtient les coordonnées à partir d'une adresse
   */
  async forwardGeocode(address: string): Promise<AddressData | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      const reverseData = await this.reverseGeocode(
        parseFloat(result.lat),
        parseFloat(result.lon)
      );

      return reverseData;
    } catch (error) {
      console.error('Forward geocoding error:', error);
      return null;
    }
  }
}

export const addressService = new AddressService();
