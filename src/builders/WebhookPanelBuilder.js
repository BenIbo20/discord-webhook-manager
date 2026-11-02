const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Colors
} = require('discord.js');

class WebhookPanelBuilder {
  static PAGE_SIZE = 3;
  static DEFAULT_AVATAR_URL = 'https://cdn.discordapp.com/embed/avatars/0.png';

  /**
   * Builds the Components V2 container for the paginated webhook list.
   * @param {import('discord.js').Webhook[]} webhooks
   * @param {number} page
   * @param {string} userId
   * @returns {ContainerBuilder}
   */
  static buildListPanel(webhooks, page, userId) {
    const totalWebhooks = webhooks.length;
    const totalPages = Math.max(1, Math.ceil(totalWebhooks / this.PAGE_SIZE));
    const currentPage = Math.min(Math.max(1, page), totalPages);

    const startIndex = (currentPage - 1) * this.PAGE_SIZE;
    const currentWebhooks = webhooks.slice(startIndex, startIndex + this.PAGE_SIZE);

    const container = new ContainerBuilder().setAccentColor(Colors.Blurple);

    // Header TextDisplay
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# 🪝 Sunucu Webhook Yönetim Paneli\nBu sunucudaki webhookları aşağıdan inceleyebilir, sayfalayabilir veya detaylarına ulaşabilirsiniz.'
      )
    );

    // Separator under header
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    // If no webhooks exist on the server
    if (totalWebhooks === 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '### ℹ️ Henüz Webhook Bulunmuyor\nBu sunucuda oluşturulmuş aktif bir webhook bulunamadı.\nYeni bir webhook oluşturmak için `/webhook olustur` komutunu kullanabilirsiniz.'
        )
      );

      // Refresh button row
      const emptyRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`wh:ref:${userId}:1`)
          .setLabel('Yenile')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary)
      );
      container.addActionRowComponents(emptyRow);
      return container;
    }

    // Display each webhook in its own SectionBuilder with a ThumbnailBuilder accessory on the right
    currentWebhooks.forEach((wh, index) => {
      const avatarUrl = wh.avatarURL() || this.DEFAULT_AVATAR_URL;
      const urlStatus = wh.token ? '🟢 Erişilebilir (Token Mevcut)' : '🔒 Gizli / Token Yok';
      const createdFormatted = wh.createdAt ? `<t:${Math.floor(wh.createdAt.getTime() / 1000)}:R>` : 'Bilinmiyor';

      const sectionText = [
        `### 🔗 ${wh.name}`,
        `**ID:** \`${wh.id}\` • **Kanal:** <#${wh.channelId}> (\`${wh.channelId}\`)`,
        `**Oluşturulma:** ${createdFormatted} • **URL Durumu:** ${urlStatus}`
      ].join('\n');

      const section = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(sectionText))
        .setThumbnailAccessory(
          new ThumbnailBuilder({
            media: { url: avatarUrl }
          })
        );

      container.addSectionComponents(section);

      // Separator between webhooks
      if (index < currentWebhooks.length - 1) {
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
      }
    });

    // Separator before controls
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    // Footer info TextDisplay
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📊 **Sayfa:** ${currentPage} / ${totalPages} • **Toplam Webhook:** ${totalWebhooks}`
      )
    );

    // Quick Action / URL View Select Menu for the current page webhooks
    if (currentWebhooks.length > 0) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`wh:url_sel:${userId}`)
        .setPlaceholder('🔑 Bir webhookun güvenli URL bağlantısını görüntüle...')
        .addOptions(
          currentWebhooks.map((wh) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(wh.name.length > 25 ? `${wh.name.slice(0, 22)}...` : wh.name)
              .setDescription(`ID: ${wh.id} • Kanal: ${wh.channelId}`)
              .setValue(wh.id)
              .setEmoji('🔗')
          )
        );

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);
      container.addActionRowComponents(selectRow);
    }

    // Pagination Controls ActionRow
    const prevButton = new ButtonBuilder()
      .setCustomId(`wh:page:${userId}:${currentPage - 1}`)
      .setLabel('Önceki')
      .setEmoji('◀')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage <= 1);

    const refreshButton = new ButtonBuilder()
      .setCustomId(`wh:ref:${userId}:${currentPage}`)
      .setLabel('Yenile')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary);

    const nextButton = new ButtonBuilder()
      .setCustomId(`wh:page:${userId}:${currentPage + 1}`)
      .setLabel('Sonraki')
      .setEmoji('▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage >= totalPages);

    const paginationRow = new ActionRowBuilder().addComponents(
      prevButton,
      refreshButton,
      nextButton
    );

    container.addActionRowComponents(paginationRow);

    return container;
  }

  /**
   * Builds the Components V2 container for detailed webhook information.
   * @param {import('discord.js').Webhook} webhook
   * @param {string} userId
   * @returns {ContainerBuilder}
   */
  static buildInfoPanel(webhook, userId) {
    const avatarUrl = webhook.avatarURL() || this.DEFAULT_AVATAR_URL;
    const urlStatus = webhook.token ? '🟢 Erişilebilir (Token Mevcut)' : '🔒 Token Yok / Yalnızca Sunucu';
    const createdTimestamp = webhook.createdAt ? Math.floor(webhook.createdAt.getTime() / 1000) : null;
    const createdDate = createdTimestamp
      ? `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`
      : 'Bilinmiyor';

    const ownerName = webhook.owner
      ? ('tag' in webhook.owner && typeof webhook.owner.tag === 'string'
          ? webhook.owner.tag
          : webhook.owner.username)
      : 'Bilinmiyor';
    const ownerText = webhook.owner ? `<@${webhook.owner.id}> (\`${ownerName}\`)` : 'Bilinmiyor';

    const container = new ContainerBuilder()
      .setAccentColor(Colors.Blue)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ℹ️ Webhook Detay Bilgisi\n\`${webhook.name}\` adlı webhookun ayrıntılı yapılandırması:`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `**Webhook Adı:** \`${webhook.name}\``,
                `**Webhook ID:** \`${webhook.id}\``,
                `**Kanal:** <#${webhook.channelId}> (\`${webhook.channelId}\`)`,
                `**Oluşturan:** ${ownerText}`,
                `**Oluşturulma Tarihi:** ${createdDate}`,
                `**URL Durumu:** ${urlStatus}`
              ].join('\n')
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder({
              media: { url: avatarUrl }
            })
          )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`wh:url:${userId}:${webhook.id}`)
        .setLabel('URL Görüntüle')
        .setEmoji('🔑')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!webhook.token),
      new ButtonBuilder()
        .setCustomId(`wh:del_prompt:${userId}:${webhook.id}`)
        .setLabel('Webhooku Sil')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger)
    );

    container.addActionRowComponents(actionRow);
    return container;
  }

  /**
   * Builds the Components V2 confirmation container for webhook deletion.
   * @param {import('discord.js').Webhook} webhook
   * @param {string} userId
   * @returns {ContainerBuilder}
   */
  static buildDeleteConfirmationPanel(webhook, userId) {
    const avatarUrl = webhook.avatarURL() || this.DEFAULT_AVATAR_URL;

    const container = new ContainerBuilder()
      .setAccentColor(Colors.Red)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '# ⚠️ Webhook Silme Onayı\nAşağıdaki webhooku kalıcı olarak silmek istediğinizden emin misiniz?'
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `**Webhook Adı:** \`${webhook.name}\``,
                `**Webhook ID:** \`${webhook.id}\``,
                `**Kanal:** <#${webhook.channelId}> (\`${webhook.channelId}\`)`,
                `> ⚠️ **UYARI:** Bu işlem geri alınamaz! Bu webhooka bağlı olan servisler çalışmayı durduracaktır.`
              ].join('\n')
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder({
              media: { url: avatarUrl }
            })
          )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`wh:del_ok:${userId}:${webhook.id}`)
        .setLabel('Onayla ve Sil')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`wh:del_no:${userId}:${webhook.id}`)
        .setLabel('Vazgeç')
        .setEmoji('✖')
        .setStyle(ButtonStyle.Secondary)
    );

    container.addActionRowComponents(actionRow);
    return container;
  }

  /**
   * Builds the Components V2 container for a successfully created webhook.
   * @param {import('discord.js').Webhook} webhook
   * @returns {ContainerBuilder}
   */
  static buildCreatedPanel(webhook) {
    const avatarUrl = webhook.avatarURL() || this.DEFAULT_AVATAR_URL;

    return new ContainerBuilder()
      .setAccentColor(Colors.Green)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '# ✅ Webhook Başarıyla Oluşturuldu\nYeni webhook tanımlandı ve kullanıma hazır.'
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `**Webhook Adı:** \`${webhook.name}\``,
                `**Webhook ID:** \`${webhook.id}\``,
                `**Kanal:** <#${webhook.channelId}>`,
                `> 💡 *Webhook URL'sini güvenli bir şekilde görüntülemek için \`/webhook bilgi\` komutunu kullanabilirsiniz.*`
              ].join('\n')
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder({
              media: { url: avatarUrl }
            })
          )
      );
  }

  /**
   * Builds the Components V2 container for an edited webhook.
   * @param {import('discord.js').Webhook} webhook
   * @returns {ContainerBuilder}
   */
  static buildEditedPanel(webhook) {
    const avatarUrl = webhook.avatarURL() || this.DEFAULT_AVATAR_URL;

    return new ContainerBuilder()
      .setAccentColor(Colors.Gold)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '# ✏️ Webhook Başarıyla Güncellendi\nWebhook bilgileri başarıyla revize edildi.'
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `**Güncel Ad:** \`${webhook.name}\``,
                `**Webhook ID:** \`${webhook.id}\``,
                `**Kanal:** <#${webhook.channelId}>`
              ].join('\n')
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder({
              media: { url: avatarUrl }
            })
          )
      );
  }

  /**
   * Builds the Components V2 ephemeral display container for viewing a sensitive webhook URL.
   * @param {import('discord.js').Webhook} webhook
   * @returns {ContainerBuilder}
   */
  static buildUrlDisplayPanel(webhook) {
    const avatarUrl = webhook.avatarURL() || this.DEFAULT_AVATAR_URL;

    return new ContainerBuilder()
      .setAccentColor(Colors.DarkGold)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '# 🔐 Güvenli Webhook URL Erişimi\nAşağıdaki bağlantı bu webhookun erişim tokenını barındırır. Bu bilgiyi kesinlikle başkalarıyla paylaşmayın!'
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `**Webhook:** \`${webhook.name}\` (\`${webhook.id}\`)`,
                `**Webhook URL:**`,
                `\`\`\`\n${webhook.url}\n\`\`\``
              ].join('\n')
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder({
              media: { url: avatarUrl }
            })
          )
      );
  }

  /**
   * Builds a simple Components V2 feedback container.
   * @param {string} title
   * @param {string} message
   * @param {number} color
   * @returns {ContainerBuilder}
   */
  static buildSimplePanel(title, message, color) {
    return new ContainerBuilder()
      .setAccentColor(color)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${title}\n${message}`)
      );
  }
}

module.exports = { WebhookPanelBuilder };

