import { main } from '../assets/lambdas/ingress';

jest.mock('../assets/utils/store-ingress-data');

describe('main', () => {
  test('should return 404 status and error message when event path is not "/ingest"', async () => {
    const result = await main({ path: '/invalid', body: '{}' });
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      message: 'No Content, Please check the API URL and API key',
    });
  });
});
