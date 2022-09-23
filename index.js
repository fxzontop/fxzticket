require('dotenv').config();
const discord = require('discord.js');
const { ticketChannelId, adminChannelId, ticketPrefix } = require('./config.json');

const xZ = new discord.Client({
	intents: [
		discord.GatewayIntentBits.DirectMessages,
		discord.GatewayIntentBits.Guilds,
		discord.GatewayIntentBits.GuildBans,
		discord.GatewayIntentBits.GuildMessages,
		discord.GatewayIntentBits.MessageContent,
	],
	partials: [discord.Partials.Channel],
});

xZ .on('ready', () => {
	const status = [
		'🥇 xZ  Owner.',
		'💌 Contato: \n FrancexZ #2283.',
		'.'
	];
	i = 0;
	xZ .user.setActivity(status[0]);
	setInterval(() => xZ .user.setActivity(`${status[i++ % status.length]}`, {
		type: 'PLAYING',
	}), 1000 * 60 * 15);
	xZ .user.setStatus('online');
	console.log('😍 ' + xZ .user.username + ' started working!');
});

xZ .on('messageCreate', async (msg) => {
	if (msg.author.bot) return;
	if (!msg.member.permissions.has('ADMINISTRATOR')) return;
	if (msg.channel.type === 'dm') return;

	const prefix = ticketPrefix;

	if (!msg.content.startsWith(prefix)) return;
	const ticketChannel = xZ .channels.cache.find(channel => channel.id === ticketChannelId);
	msg.delete();
	const row = new discord.ActionRowBuilder()
		.addComponents(
			new discord.ButtonBuilder()
				.setCustomId('ticket')
				.setLabel('Criar Ticket')
				.setStyle('Secondary'),
		);

	const embed = new discord.EmbedBuilder()
		.setColor('#2f3136')
		.setImage('https://media.discordapp.net/attachments/1021494753117872182/1021494828271407144/standard.gif')
		.setAuthor({ name: 'Criar ticket de atendimento | xZ  Store', iconURL: 'https://media.discordapp.net/attachments/1021494753117872182/1021495591370502289/static.png', url: 'https://discord.gg/8ACMGdJ4wS' })
		.setURL('https://discord.gg/8ACMGdJ4wS')
		.setDescription('Para dúvidas, suporte, contato profissional, orçamentos e compras.')
		.setFooter({ text: 'xZ © 2022', iconURL: 'https://media.discordapp.net/attachments/1021494753117872182/1021495591370502289/static.png' });

	ticketChannel.send({ ephemeral: true, embeds: [embed], components: [row] });
});

xZ .on('interactionCreate', async interaction => {
	if (interaction.customId === 'ticket') {
		if (!interaction.isButton()) return;
		const guild = xZ .guilds.cache.get(interaction.guild.id);
		const guildChannels = guild.channels.cache;
		const userFirstName = interaction.user.username.split(' ')[0].toLowerCase();
		const interactionChannelName = `ticket-${userFirstName}`;
		const adminAlertChannel = xZ .channels.cache.find(channel => channel.id === adminChannelId);
		const errorEmbed = new discord.EmbedBuilder()
			.setDescription('❌ Você já possui um ticket aberto! Encerre o ticket atual para poder abrir um novo.')
			.setColor('#2f3136')
			.setFooter({ text: 'xZ © 2022', iconURL: 'https://media.discordapp.net/attachments/1021494753117872182/1021495591370502289/static.png' });

		const sucessEmbed = new discord.EmbedBuilder()
			.setDescription('✅ Você foi mencionado no canal correspondente ao seu ticket.')
			.setColor('#2f3136')
			.setFooter({ text: 'xZ © 2022', iconURL: 'https://media.discordapp.net/attachments/1021494753117872182/1021495591370502289/static.png' });

		const adminMessage = new discord.EmbedBuilder()
			.setDescription(`☄️ Um ticket foi aberto! ${interaction.user.id}`)
			.addFields([
				{
					name: '😀 Usuário:',
					value: `${interaction.user.username}`,
					inline: true
				}
			])
			.setColor('#2f3136')
			.setFooter({ text: 'xZ © 2022', iconURL: 'https://media.discordapp.net/attachments/1021494753117872182/1021495591370502289/static.png' });

		for (const channel of guildChannels.values()) {
			if(channel.name.startsWith('ticket')) {
				if(channel.topic === interaction.user.id) {
					return interaction.reply({ ephemeral: true, embeds: [errorEmbed] });
				}
			}
		}

		adminAlertChannel.send({ ephemeral: true, embeds: [adminMessage] });

		guild.channels.create({
			name: interactionChannelName,
			permissionOverwrites: [
				{
					id: interaction.user.id,
					allow: [discord.PermissionFlagsBits.SendMessages, discord.PermissionFlagsBits.ViewChannel],
				},
				{
					id: interaction.guild.roles.everyone,
					deny: [discord.PermissionFlagsBits.ViewChannel],
				}
			],
			type: discord.ChannelType.GuildText,
			//parent: 'xxx',
		}).then(async channel => {
			channel.setTopic(interaction.user.id);
			const embed = new discord.EmbedBuilder()
				.setDescription('☄️ Você solicitou um ticket. Entraremos em contato o mais rápido possível, aguarde. Clique no botão vermelho para encerrar o ticket.')
				.setColor('#2f3136')
				.setFooter({ text: 'xZ © 2022', iconURL: 'https://media.discordapp.net/attachments/1021494753117872182/1021495591370502289/static.png' });

			const deleteButton = new discord.ActionRowBuilder()
				.addComponents(
					new discord.ButtonBuilder()
						.setCustomId('delete')
						.setLabel('Cancelar Ticket')
						.setStyle('Danger'),
				);

			await channel.send({ ephemeral: true, embeds: [embed], components: [deleteButton], content: `||<@${interaction.user.id}>||` });
			interaction.reply({ ephemeral: true, embeds: [sucessEmbed] });
		})
	}
	if (interaction.customId === 'delete') {
		interaction.channel.delete();
		const adminAlertChannel = xZ .channels.cache.find(channel => channel.id === adminChannelId);
		const deleteMessage = new discord.EmbedBuilder()
			.setDescription(`❌ Ticket encerrado! ${interaction.user.id}`)
			.addFields([
				{
					name: '😀 Usuário:',
					value: `${interaction.user.username}`,
					inline: true
				}
			])
			.setColor('#2f3136')
			.setFooter({ text: 'xZ © 2022', iconURL: 'https://media.discordapp.net/attachments/1021494753117872182/1021495591370502289/static.png' });

		await interaction.user.send({ ephemeral: true, embeds: [deleteMessage] }).catch(() => {
			adminAlertChannel.send({ ephemeral: true, embeds: [deleteMessage] });
			return false;
		});
		adminAlertChannel.send({ ephemeral: true, embeds: [deleteMessage] });
	}
});
xZ .login("MTAyMTI1Mjg3NzAwNTYyNzM5NA.GNXdb8.iLFnlZoDfKShygU-VghYh56KtcbbVzUEdMMGM8");
