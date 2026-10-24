const { test, expect } = require('@playwright/test');
const { LoginApi } = require('../pages/LoginApi');
const users = require('../fixtures/users.json');

test.describe('Validação de Login - Backend API (ReqRes)', () => {
  let loginApi;

  test.beforeEach(async ({ request }) => {
    loginApi = new LoginApi(request, '', {
      maxRetries: 8,
      retryDelay: 8000,
    });
  });

  test.afterEach(async () => {
    if (loginApi) {
      await loginApi.close();
    }
    // Delay mais longo para não estourar o rate-limit keyless
    await new Promise(r => setTimeout(r, 3000)); // 3 segundos
  });

  // ============================================================================
  // Cenário 1: Validação de endpoint e estrutura da resposta
  // ============================================================================
  test.describe('Validação de endpoint e estrutura da resposta', () => {
    test('deve retornar status 200, body, headers content-type JSON e duration para login válido', async () => {
      const response = await loginApi.login(users.validUser);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');
      expect(body.token.length).toBeGreaterThan(0);

      const headers = response.headers();
      expect(headers['content-type']).toContain('application/json');

      expect(response.duration).toBeGreaterThan(0);
      expect(response.duration).toBeLessThan(30000);
    });
  });


  // ============================================================================
  // Cenário 2: Login com credenciais válidas
  // ============================================================================
  test.describe('Login com credenciais válidas', () => {
    test('deve retornar status 200 e um token válido (string não vazia)', async () => {
      const response = await loginApi.login(users.validUser);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');
      expect(body.token.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Cenário 3: Login com credenciais inválidas
  // ============================================================================
  test.describe('Login com credenciais inválidas', () => {
    test('deve retornar status 400 e propriedade error com mensagem', async () => {
      const response = await loginApi.login(users.invalidUser);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Cenário 4: Validação de campos obrigatórios
  // ============================================================================
  test.describe('Validação de campos obrigatórios', () => {
    test('deve retornar erro 400 quando o campo password está ausente', async () => {
      const response = await loginApi.login(users.missingPassword);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toContain('password');
    });

    test('deve retornar erro 400 quando o campo email está ausente', async () => {
      const response = await loginApi.login(users.missingEmail);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toContain('email');
    });

    test('deve retornar erro 400 quando o body está vazio', async () => {
      const response = await loginApi.login(users.emptyBody);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  // ============================================================================
  // Cenário 5: Fluxo completo de validação backend (happy path + negative path)
  // ============================================================================
  test.describe('Fluxo completo de validação backend', () => {
    test('deve validar happy path (sucesso) e negative path (falha) em um único teste', async () => {
      // --- Happy Path: login válido ---
      const successResponse = await loginApi.login(users.validUser);
      expect(successResponse.status()).toBe(200);

      const successBody = await successResponse.json();
      expect(successBody).toHaveProperty('token');
      expect(typeof successBody.token).toBe('string');
      expect(successBody.token.length).toBeGreaterThan(0);

      const successHeaders = successResponse.headers();
      expect(successHeaders['content-type']).toContain('application/json');

      // --- Negative Path: credenciais inválidas ---
      const errorResponse = await loginApi.login(users.invalidUser);
      expect(errorResponse.status()).toBe(400);

      const errorBody = await errorResponse.json();
      expect(errorBody).toHaveProperty('error');
      expect(typeof errorBody.error).toBe('string');
      expect(errorBody.error.length).toBeGreaterThan(0);

      // --- Negative Path: campos obrigatórios ausentes ---
      const missingPassResponse = await loginApi.login(users.missingPassword);
      expect(missingPassResponse.status()).toBe(400);

      const missingPassBody = await missingPassResponse.json();
      expect(missingPassBody).toHaveProperty('error');

      const missingEmailResponse = await loginApi.login(users.missingEmail);
      expect(missingEmailResponse.status()).toBe(400);

      const missingEmailBody = await missingEmailResponse.json();
      expect(missingEmailBody).toHaveProperty('error');

      const emptyBodyResponse = await loginApi.login(users.emptyBody);
      expect(emptyBodyResponse.status()).toBe(400);

      const emptyBodyBody = await emptyBodyResponse.json();
      expect(emptyBodyBody).toHaveProperty('error');
    });
  });
});