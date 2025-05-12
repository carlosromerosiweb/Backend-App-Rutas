import { OfflineSyncPayload } from '../types/offline-sync';
import { OfflineSyncService } from '../services/offline-sync.service';
import { logger } from '../utils/logger';

async function testOfflineSync() {
  try {
    // Crear datos de prueba
    const testData: OfflineSyncPayload = {
      leads: [
        {
          local_id: 'lead_1',
          name: 'Test Lead 1',
          email: 'test1@example.com',
          phone: '123456789',
          address: 'Calle Test 1',
          city: 'Ciudad Test',
          state: 'Estado Test',
          country: 'País Test',
          coordinates: {
            latitude: 40.4168,
            longitude: -3.7038
          },
          estimated_value: 1000,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          next_followup: new Date(Date.now() + 86400000).toISOString() // mañana
        }
      ],
      checkins: [
        {
          local_id: 'checkin_1',
          lead_id: 'lead_1',
          latitude: 40.4168,
          longitude: -3.7038,
          notes: 'Visita de prueba',
          photos: ['foto1.jpg', 'foto2.jpg'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      lead_interactions: [
        {
          local_id: 'interaction_1',
          lead_id: 'lead_1',
          type: 'visit',
          notes: 'Interacción de prueba',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    };

    // Crear instancia del servicio
    const syncService = new OfflineSyncService();

    // Simular ID de usuario (reemplazar con un ID válido de tu base de datos)
    const testUserId = '1';

    // Intentar sincronizar
    const result = await syncService.syncOfflineData(testData, testUserId);

    // Mostrar resultado
    console.log('Resultado de la sincronización:', JSON.stringify(result, null, 2));

  } catch (error) {
    logger.error('Error en la prueba de sincronización:', error);
  }
}

// Ejecutar la prueba
testOfflineSync(); 