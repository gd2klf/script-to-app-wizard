
import { UserManager, User } from 'oidc-client-ts';

class OktaAuthService {
  private userManager: UserManager;

  constructor() {
    const domain = import.meta.env.VITE_OKTA_DOMAIN || 'https://your-okta-domain/oauth2/default';
    const clientId = import.meta.env.VITE_OKTA_CLIENT_ID || 'your-client-id';
    
    this.userManager = new UserManager({
      authority: domain,
      client_id: clientId,
      redirect_uri: `${window.location.origin}/callback`,
      post_logout_redirect_uri: `${window.location.origin}`,
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
