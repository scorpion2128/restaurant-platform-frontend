import api from './api';
import { RESTAURANTS } from '../constants/apiEndpoints';

export const restaurantService = {
  // Obtener configuración del restaurante
  getRestaurantSettings: async (restaurantId) => {
    const response = await api.get(RESTAURANTS.BY_ID(restaurantId));
    return response;
  },

  // Actualizar configuración del restaurante
  updateRestaurantSettings: async (restaurantId, settings) => {
    const response = await api.patch(RESTAURANTS.SETTINGS(restaurantId), settings);
    return response;
  }
};

export default restaurantService;
