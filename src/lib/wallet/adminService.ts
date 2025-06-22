/**
 * Admin management service
 * Handles admin privileges and permissions
 */

export class AdminService {
  private adminPubkeys: string[];
  private onConfigUpdate: (updates: { adminPubkeys: string[] }) => void;

  constructor(
    adminPubkeys: string[],
    onConfigUpdate: (updates: { adminPubkeys: string[] }) => void
  ) {
    this.adminPubkeys = adminPubkeys;
    this.onConfigUpdate = onConfigUpdate;
  }

  isAdmin(pubkey: string): boolean {
    return this.adminPubkeys.includes(pubkey);
  }

  addAdmin(pubkey: string) {
    if (!this.adminPubkeys.includes(pubkey)) {
      const updatedAdmins = [...this.adminPubkeys, pubkey];
      this.adminPubkeys = updatedAdmins;
      this.onConfigUpdate({ adminPubkeys: updatedAdmins });
    }
  }

  removeAdmin(pubkey: string) {
    const updatedAdmins = this.adminPubkeys.filter((p) => p !== pubkey);
    this.adminPubkeys = updatedAdmins;
    this.onConfigUpdate({ adminPubkeys: updatedAdmins });
  }

  getAdmins(): string[] {
    return [...this.adminPubkeys];
  }

  updateAdmins(adminPubkeys: string[]) {
    this.adminPubkeys = adminPubkeys;
  }
}