class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.emailInput = '~email_input';
    this.passwordInput = '~password_input';
    this.loginButton = '~login_button';
    this.registerLink = '~register_link';
    this.forgotPasswordLink = '~forgot_password_link';
  }

  async enterEmail(email) {
    if (this.driver) {
      const el = await this.driver.$(this.emailInput);
      await el.setValue(email);
    }
  }

  async enterPassword(password) {
    if (this.driver) {
      const el = await this.driver.$(this.passwordInput);
      await el.setValue(password);
    }
  }

  async clickLogin() {
    if (this.driver) {
      const el = await this.driver.$(this.loginButton);
      await el.click();
    }
  }

  async login(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLogin();
  }
}

module.exports = LoginPage;
