import api from './api';

export const restaurantService = {
  // Obtener configuración del restaurante
  getRestaurantSettings: async (restaurantId) => {
    const response = await api.get(`/restaurants/${restaurantId}`);
    return response;
  },

  // Actualizar configuración del restaurante
  updateRestaurantSettings: async (restaurantId, settings) => {
    const response = await api.patch(`/restaurants/${restaurantId}/settings`, settings);
    return response;
  }
};

export default restaurantService;
