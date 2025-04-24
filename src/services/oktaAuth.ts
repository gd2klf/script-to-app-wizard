
import { UserManager, User } from 'oidc-client-ts';

class OktaAuthService {
  private userManager: UserManager;

  constructor() {
    this.userManager = new UserManager({
      authority: 'https://your-okta-domain/oauth2/default',
      client_id: 'your-client-id',
      redirect_uri: `${window.location.origin}/callback`,
      response_type: 'code',
      scope: 'openid profile email',
    });
  }

  async login(): Promise<void> {
    await this.userManager.signinRedirect();
  }

  async logout(): Promise<void> {
    await this.userManager.signoutRedirect();
  }

  async getUser(): Promise<User | null> {
    return await this.userManager.getUser();
  }

  async handleCallback(): Promise<User | null> {
    const user = await this.userManager.signinRedirectCallback();
    return user;
  }
}

export const oktaAuth = new OktaAuthService();
