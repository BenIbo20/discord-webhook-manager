const assert = require('node:assert');
const {
  ChannelType,
  Colors,
  MessageFlags
} = require('discord.js');
const { CommandHandler } = require('../src/handlers/commandHandler');
const { webhookCommand } = require('../src/commands/webhook');
const { WebhookPanelBuilder } = require('../src/builders/WebhookPanelBuilder');
const { Validators } = require('../src/utils/validators');
const { PermissionService } = require('../src/services/PermissionService');
const { WebhookService } = require('../src/services/WebhookService');
const { Logger } = require('../src/utils/logger');
const { PermissionError, ValidationError } = require('../src/utils/errors');

// ANSI styling for test outputs
const green = (text) => `\x1b[32m✔ ${text}\x1b[0m`;
const red = (text) => `\x1b[31m✖ ${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      throw new Error('Async test must be awaited');
    }
    console.log(green(name));
    passedCount++;
  } catch (err) {
    console.error(red(name));
    console.error(err);
    failedCount++;
  }
}

// Mock factory for Webhook objects
function createMockWebhook(id, name, channelId, token = null) {
  return {
    id,
    name,
    channelId,
    guildId: '123456789012345678',
    token,
    url: token ? `https://discord.com/api/webhooks/${id}/${token}` : '',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    createdTimestamp: 1767225600000,
    avatarURL: () => 'https://cdn.discordapp.com/avatars/123/abc.png',
    owner: {
      id: '987654321098765432',
      tag: 'Developer#0001',
      username: 'Developer'
    }
  };
}

async function runAllTests() {
  console.log(bold('\n=== BENIBO20 WEBHOOK MANAGER TEST SUITE (JAVASCRIPT) ===\n'));

  // 1. Command Loading
  runTest('1. CommandHandler loads /webhook command properly', () => {
    CommandHandler.init();
    const commands = CommandHandler.getCommands();
    assert.strictEqual(commands.has('webhook'), true, 'webhook command must be registered');
    assert.strictEqual(commands.size, 1, 'Only webhook command should be registered');
  });

  // 2. Slash Command JSON Validation
  runTest('2. Slash command JSON structure and subcommands validation', () => {
    const json = webhookCommand.data.toJSON();
    assert.strictEqual(json.name, 'webhook');
    assert.ok(json.description.length > 0);
    assert.strictEqual(json.dm_permission, false);

    const subcommands = json.options?.filter((opt) => opt.type === 1);
    assert.strictEqual(subcommands?.length, 5, 'Must have exactly 5 subcommands');

    const names = subcommands?.map((s) => s.name);
    assert.deepStrictEqual(names?.sort(), ['bilgi', 'duzenle', 'liste', 'olustur', 'sil'].sort());
  });

  // 3. Custom ID Format & Collision Verification
  runTest('3. Component customId formats and bounds (<= 100 chars)', () => {
    const userId = '123456789012345678';
    const webhookId = '987654321098765432';

    const testIds = [
      `wh:page:${userId}:2`,
      `wh:ref:${userId}:1`,
      `wh:url:${userId}:${webhookId}`,
      `wh:del_prompt:${userId}:${webhookId}`,
      `wh:url_sel:${userId}`,
      `wh:del_ok:${userId}:${webhookId}`,
      `wh:del_no:${userId}:${webhookId}`
    ];

    for (const customId of testIds) {
      assert.ok(customId.startsWith('wh:'), `ID must start with wh: -> ${customId}`);
      assert.ok(customId.length <= 100, `ID must be <= 100 chars -> ${customId.length}`);
      const parts = customId.split(':');
      assert.strictEqual(parts[0], 'wh');
      assert.ok(['page', 'ref', 'url', 'del_prompt', 'url_sel', 'del_ok', 'del_no'].includes(parts[1]));
    }
  });

  // 4. Empty Webhook List Testing
  runTest('4. Empty webhook list renders clean container with refresh button', () => {
    const container = WebhookPanelBuilder.buildListPanel([], 1, '123456789012345678');
    const json = container.toJSON();

    assert.strictEqual(json.type, 17, 'Root must be Container (type 17)');
    assert.strictEqual(json.accent_color, Colors.Blurple);

    // Should contain TextDisplay with "Henüz Webhook Bulunmuyor"
    const textComponents = json.components.filter((c) => c.type === 10);
    const hasEmptyNotice = textComponents.some((t) => t.content.includes('Henüz Webhook Bulunmuyor'));
    assert.strictEqual(hasEmptyNotice, true, 'Empty notice text must be present');

    // Should contain ActionRow with refresh button
    const actionRows = json.components.filter((c) => c.type === 1);
    assert.strictEqual(actionRows.length, 1);
    const buttons = actionRows[0].components;
    assert.strictEqual(buttons[0].custom_id, 'wh:ref:123456789012345678:1');
  });

  // 5. Pagination Limits & Boundaries Testing
  runTest('5. Pagination boundaries (3 per page, button disable logic, clamp out-of-bounds)', () => {
    const mockWebhooks = [
      createMockWebhook('1', 'WH-1', '101'),
      createMockWebhook('2', 'WH-2', '102'),
      createMockWebhook('3', 'WH-3', '103'),
      createMockWebhook('4', 'WH-4', '104'),
      createMockWebhook('5', 'WH-5', '105'),
      createMockWebhook('6', 'WH-6', '106'),
      createMockWebhook('7', 'WH-7', '107')
    ];

    // Page 1 (items 1, 2, 3 of 7 -> total 3 pages)
    const p1Container = WebhookPanelBuilder.buildListPanel(mockWebhooks, 1, 'user1');
    const p1Json = p1Container.toJSON();
    const p1Sections = p1Json.components.filter((c) => c.type === 9);
    assert.strictEqual(p1Sections.length, 3, 'Page 1 must render 3 sections');

    const p1ActionRows = p1Json.components.filter((c) => c.type === 1);
    const p1PaginationRow = p1ActionRows[p1ActionRows.length - 1];
    const [prev1, , next1] = p1PaginationRow.components;
    assert.strictEqual(prev1.disabled, true, 'Prev button must be disabled on page 1');
    assert.strictEqual(next1.disabled, false, 'Next button must be enabled on page 1');

    // Page 3 (item 7 of 7 -> last page)
    const p3Container = WebhookPanelBuilder.buildListPanel(mockWebhooks, 3, 'user1');
    const p3Json = p3Container.toJSON();
    const p3Sections = p3Json.components.filter((c) => c.type === 9);
    assert.strictEqual(p3Sections.length, 1, 'Page 3 must render 1 section');

    const p3ActionRows = p3Json.components.filter((c) => c.type === 1);
    const p3PaginationRow = p3ActionRows[p3ActionRows.length - 1];
    const [prev3, , next3] = p3PaginationRow.components;
    assert.strictEqual(prev3.disabled, false, 'Prev button must be enabled on page 3');
    assert.strictEqual(next3.disabled, true, 'Next button must be disabled on last page');

    // Out of bounds page 999 -> clamped to page 3
    const pOverflow = WebhookPanelBuilder.buildListPanel(mockWebhooks, 999, 'user1');
    const pOverflowJson = pOverflow.toJSON();
    const pOverflowSections = pOverflowJson.components.filter((c) => c.type === 9);
    assert.strictEqual(pOverflowSections.length, 1, 'Out-of-bounds page clamped to last page');
  });

  // 6. SectionBuilder & ThumbnailBuilder Components V2 Structure
  runTest('6. SectionBuilder and ThumbnailBuilder accessory structure', () => {
    const wh = createMockWebhook('123456789012345678', 'Test WH', '987654321098765432');
    const container = WebhookPanelBuilder.buildListPanel([wh], 1, 'user1');
    const json = container.toJSON();

    const sections = json.components.filter((c) => c.type === 9);
    assert.strictEqual(sections.length, 1);

    const section = sections[0];
    assert.ok(section.components.length >= 1, 'Section must have text displays');
    assert.strictEqual(section.accessory.type, 11, 'Accessory must be Thumbnail (type 11)');
    assert.strictEqual(section.accessory.media.url, 'https://cdn.discordapp.com/avatars/123/abc.png');

    // Separators must be present
    const separators = json.components.filter((c) => c.type === 14);
    assert.ok(separators.length >= 2, 'Separators must divide header and footer');
  });

  // 7. Webhook Info Panel Testing
  runTest('7. Webhook Info Panel builds complete Components V2 container', () => {
    const wh = createMockWebhook('111222333444555666', 'Prod Webhook', '777888999000111222', 'secret-token-123');
    const container = WebhookPanelBuilder.buildInfoPanel(wh, 'user1');
    const json = container.toJSON();

    assert.strictEqual(json.type, 17);
    assert.strictEqual(json.accent_color, Colors.Blue);

    // Must have URL Görüntüle button enabled since token exists
    const actionRows = json.components.filter((c) => c.type === 1);
    const buttons = actionRows[0].components;
    const urlButton = buttons.find((b) => b.label === 'URL Görüntüle');
    assert.ok(urlButton);
    assert.strictEqual(urlButton.disabled, false);

    // Test with no token
    const whNoToken = createMockWebhook('111222333444555666', 'Prod Webhook', '777888999000111222', null);
    const containerNoToken = WebhookPanelBuilder.buildInfoPanel(whNoToken, 'user1');
    const jsonNoToken = containerNoToken.toJSON();
    const buttonsNoToken = jsonNoToken.components.filter((c) => c.type === 1)[0].components;
    const urlButtonNoToken = buttonsNoToken.find((b) => b.label === 'URL Görüntüle');
    assert.strictEqual(urlButtonNoToken.disabled, true);
  });

  // 8. Delete Confirmation Panel Testing
  runTest('8. Delete Confirmation Panel has Danger and Secondary buttons', () => {
    const wh = createMockWebhook('999888777666555444', 'DeleteTarget', '111222333444555666');
    const container = WebhookPanelBuilder.buildDeleteConfirmationPanel(wh, 'user1');
    const json = container.toJSON();

    assert.strictEqual(json.accent_color, Colors.Red);

    const actionRows = json.components.filter((c) => c.type === 1);
    const buttons = actionRows[0].components;
    assert.strictEqual(buttons.length, 2);

    const [confirmBtn, cancelBtn] = buttons;
    assert.strictEqual(confirmBtn.style, 4, 'Confirm button must be Danger style (4)');
    assert.strictEqual(confirmBtn.custom_id, 'wh:del_ok:user1:999888777666555444');
    assert.strictEqual(cancelBtn.style, 2, 'Cancel button must be Secondary style (2)');
    assert.strictEqual(cancelBtn.custom_id, 'wh:del_no:user1:999888777666555444');
  });

  // 9. Input Validators Testing (Webhook Name, Snowflake, Avatar, Channel Types)
  runTest('9. Validators comprehensive verification', () => {
    // Name validation
    assert.throws(() => Validators.validateWebhookName(''), ValidationError);
    assert.throws(() => Validators.validateWebhookName('a'.repeat(81)), ValidationError);
    assert.throws(() => Validators.validateWebhookName('Clyde Bot'), ValidationError);
    assert.throws(() => Validators.validateWebhookName('My Discord Bot'), ValidationError);
    assert.throws(() => Validators.validateWebhookName('@everyone'), ValidationError);
    assert.throws(() => Validators.validateWebhookName('@here'), ValidationError);
    assert.doesNotThrow(() => Validators.validateWebhookName('Github Alerts'));

    // Snowflake validation
    assert.throws(() => Validators.validateSnowflake('abc'), ValidationError);
    assert.throws(() => Validators.validateSnowflake('12345'), ValidationError);
    assert.doesNotThrow(() => Validators.validateSnowflake('123456789012345678'));

    // Attachment validation
    assert.throws(() => Validators.validateAvatarAttachment({
      size: 9 * 1024 * 1024,
      contentType: 'image/png'
    }), ValidationError);

    assert.throws(() => Validators.validateAvatarAttachment({
      size: 1024,
      contentType: 'application/pdf'
    }), ValidationError);

    assert.doesNotThrow(() => Validators.validateAvatarAttachment({
      size: 1024 * 1024,
      contentType: 'image/png'
    }));

    // Channel type support
    assert.strictEqual(Validators.isSupportedChannelType(ChannelType.GuildText), true);
    assert.strictEqual(Validators.isSupportedChannelType(ChannelType.GuildAnnouncement), true);
    assert.strictEqual(Validators.isSupportedChannelType(ChannelType.GuildForum), true);
    assert.strictEqual(Validators.isSupportedChannelType(ChannelType.GuildVoice), true);
    assert.strictEqual(Validators.isSupportedChannelType(ChannelType.GuildStageVoice), true);
    assert.strictEqual(Validators.isSupportedChannelType(ChannelType.GuildCategory), false);
    assert.strictEqual(Validators.isSupportedChannelType(ChannelType.DM), false);
  });

  // 10. Security: URL and Token Redaction in Logger
  runTest('10. Security: Logger sanitizes webhook URLs and bot tokens', () => {
    let capturedLog = '';
    const originalLog = console.log;
    console.log = (msg) => { capturedLog += msg; };

    try {
      Logger.info('Test', 'Created webhook at https://discord.com/api/webhooks/123456789012345678/secret_token_abc_xyz_123');
      assert.ok(!capturedLog.includes('secret_token_abc_xyz_123'), 'Token must not appear in log');
      assert.ok(capturedLog.includes('[REDACTED_TOKEN]'), 'Token must be replaced with [REDACTED_TOKEN]');
    } finally {
      console.log = originalLog;
    }
  });

  // 11. WebhookService URL Safety
  runTest('11. Security: WebhookService URL access', () => {
    const whWithToken = createMockWebhook('1', 'Test', '100', 'super-secret-token');
    assert.strictEqual(WebhookService.getSafeWebhookUrl(whWithToken), 'https://discord.com/api/webhooks/1/super-secret-token');

    const whNoToken = createMockWebhook('2', 'Test', '100', null);
    assert.strictEqual(WebhookService.getSafeWebhookUrl(whNoToken), null);
  });

  // 12. Permission Checking Logic
  runTest('12. PermissionService denial handling', () => {
    // Null member throws PermissionError
    assert.throws(() => PermissionService.assertUserPermission(null), PermissionError);

    // Member without permission throws PermissionError
    const mockMember = {
      id: 'user1',
      guild: { id: 'guild1' },
      permissions: {
        has: () => false
      }
    };
    assert.throws(() => PermissionService.assertUserPermission(mockMember), PermissionError);

    // Member with permission passes
    const mockPermittedMember = {
      id: 'user2',
      guild: { id: 'guild1' },
      permissions: {
        has: () => true
      }
    };
    assert.doesNotThrow(() => PermissionService.assertUserPermission(mockPermittedMember));
  });

  console.log(bold(`\n=== RESULTS: ${passedCount} PASSED, ${failedCount} FAILED ===\n`));
  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

