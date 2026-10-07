require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

/* =========================================================
   CONFIGURATION
========================================================= */

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const EMBED_COLOUR = "#2F4DA8";
const RSA_LOGO = "<:Our_Logo:1557149633623363594>";
const VERSION = "1.0.0";

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error("Missing DISCORD_TOKEN, CLIENT_ID or GUILD_ID.");
    process.exit(1);
}

/* =========================================================
   CLIENT
========================================================= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

/* =========================================================
   DATA
========================================================= */

const DATA_DIR = path.join(__dirname, "data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const REMINDERS_FILE = path.join(DATA_DIR, "reminders.json");

function loadData(file, fallback = {}) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify(fallback, null, 2)
            );

            return fallback;
        }

        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch (error) {
        console.error(`Failed to load ${file}:`, error);
        return fallback;
    }
}

function saveData(file, data) {
    try {
        fs.writeFileSync(
            file,
            JSON.stringify(data, null, 2)
        );
    } catch (error) {
        console.error(`Failed to save ${file}:`, error);
    }
}

const profiles = loadData(PROFILES_FILE);
const configs = loadData(CONFIG_FILE);
const reminders = loadData(REMINDERS_FILE);

/* =========================================================
   EMBED SYSTEM
========================================================= */

function createEmbed({
    title,
    description,
    fields = [],
    thumbnail,
    image,
    footer = "Roblox Schools Association"
} = {}) {

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOUR)
        .setTimestamp();

    if (title) {
        embed.setTitle(
            `${RSA_LOGO} ${title}`
        );
    }

    if (description) {
        embed.setDescription(description);
    }

    if (fields.length) {
        embed.addFields(fields);
    }

    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }

    if (image) {
        embed.setImage(image);
    }

    if (footer) {
        embed.setFooter({
            text: footer
        });
    }

    return embed;
}

/* =========================================================
   COMMANDS
========================================================= */

const commands = [

    new SlashCommandBuilder()
        .setName("help")
        .setDescription("View RSA Utility commands."),

    new SlashCommandBuilder()
        .setName("enrol")
        .setDescription("Enrol with the Roblox Schools Association."),

    new SlashCommandBuilder()
        .setName("profile")
        .setDescription("View an RSA member profile.")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member to view.")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("View Discord information about a member.")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member to view.")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("View information about the server."),

    new SlashCommandBuilder()
        .setName("roleinfo")
        .setDescription("View information about a role.")
        .addRoleOption(option =>
            option
                .setName("role")
                .setDescription("Role to inspect.")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("channelinfo")
        .setDescription("View information about a channel.")
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("Channel to inspect.")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("View a member's avatar.")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member.")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Create a poll.")
        .addStringOption(option =>
            option
                .setName("question")
                .setDescription("Poll question.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("option1")
                .setDescription("First option.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("option2")
                .setDescription("Second option.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("option3")
                .setDescription("Third option.")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("option4")
                .setDescription("Fourth option.")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("remind")
        .setDescription("Create a reminder.")
        .addIntegerOption(option =>
            option
                .setName("minutes")
                .setDescription("Minutes until the reminder.")
                .setMinValue(1)
                .setMaxValue(10080)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("message")
                .setDescription("Reminder message.")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("welcome-config")
        .setDescription("Configure the RSA welcome system.")

].map(command => command.toJSON());

/* =========================================================
   COMMAND REGISTRATION
========================================================= */

async function registerCommands() {

    const rest = new REST({
        version: "10"
    }).setToken(TOKEN);

    console.log("Registering RSA Utility commands...");

    await rest.put(
        Routes.applicationGuildCommands(
            CLIENT_ID,
            GUILD_ID
        ),
        {
            body: commands
        }
    );

    console.log("RSA Utility commands registered.");
}

/* =========================================================
   READY
========================================================= */

client.once("ready", async () => {

    console.log(
        `Logged in as ${client.user.tag}`
    );

    client.user.setPresence({
        status: "online",
        activities: [
            {
                name: "Roblox Schools Association",
                type: 3
            }
        ]
    });

    try {
        await registerCommands();
    } catch (error) {
        console.error(
            "Command registration failed:",
            error
        );
    }

    startReminderSystem();
});

/* =========================================================
   INTERACTIONS
========================================================= */

client.on(
    "interactionCreate",
    async interaction => {

        try {

            if (interaction.isChatInputCommand()) {
                await handleCommand(interaction);
            }

            if (interaction.isButton()) {
                await handleButton(interaction);
            }

            if (interaction.isModalSubmit()) {
                await handleModal(interaction);
            }

        } catch (error) {

            console.error(
                "Interaction error:",
                error
            );

            const response = {
                content:
                    "Something went wrong while processing that request.",
                ephemeral: true
            };

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction.followUp(
                    response
                ).catch(() => {});
            } else {
                await interaction.reply(
                    response
                ).catch(() => {});
            }
        }
    }
);

/* =========================================================
   COMMAND HANDLER
========================================================= */

async function handleCommand(interaction) {

    const command =
        interaction.commandName;

    /* HELP */

    if (command === "help") {

        const embed = createEmbed({
            title: "RSA Utility",
            description:
                "Useful tools and community features for the Roblox Schools Association.",
            fields: [
                {
                    name: "RSA",
                    value:
                        "`/enrol` `/profile`"
                },
                {
                    name: "Information",
                    value:
                        "`/userinfo` `/serverinfo` `/roleinfo` `/channelinfo` `/avatar`"
                },
                {
                    name: "Tools",
                    value:
                        "`/poll` `/remind`"
                },
                {
                    name: "Configuration",
                    value:
                        "`/welcome-config`"
                }
            ]
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* ENROL */

    if (command === "enrol") {

        const existing =
            profiles[interaction.user.id];

        if (
            existing?.status === "approved"
        ) {

            const embed = createEmbed({
                title: "Already Enrolled",
                description:
                    "You are already enrolled with RSA."
            });

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const modal =
            new ModalBuilder()
                .setCustomId("enrol_modal")
                .setTitle("RSA Enrolment");

        const roblox =
            new TextInputBuilder()
                .setCustomId("roblox")
                .setLabel("Roblox Username")
                .setStyle(
                    TextInputStyle.Short
                )
                .setRequired(true)
                .setMaxLength(100);

        const organisation =
            new TextInputBuilder()
                .setCustomId("organisation")
                .setLabel("School / Organisation")
                .setStyle(
                    TextInputStyle.Short
                )
                .setRequired(false)
                .setMaxLength(150);

        const position =
            new TextInputBuilder()
                .setCustomId("position")
                .setLabel("Position / Role")
                .setStyle(
                    TextInputStyle.Short
                )
                .setRequired(false)
                .setMaxLength(150);

        const reason =
            new TextInputBuilder()
                .setCustomId("reason")
                .setLabel("Why are you joining RSA?")
                .setStyle(
                    TextInputStyle.Paragraph
                )
                .setRequired(true)
                .setMaxLength(1000);

        modal.addComponents(
            new ActionRowBuilder()
                .addComponents(roblox),

            new ActionRowBuilder()
                .addComponents(organisation),

            new ActionRowBuilder()
                .addComponents(position),

            new ActionRowBuilder()
                .addComponents(reason)
        );

        return interaction.showModal(
            modal
        );
    }

    /* PROFILE */

    if (command === "profile") {

        const user =
            interaction.options.getUser("user") ||
            interaction.user;

        const profile =
            profiles[user.id];

        if (!profile) {

            const embed = createEmbed({
                title: "RSA Profile",
                description:
                    `${user} does not currently have an RSA profile.`
            });

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const embed = createEmbed({
            title: "RSA Profile",
            thumbnail:
                user.displayAvatarURL({
                    size: 256
                }),
            fields: [
                {
                    name: "Member",
                    value: user.toString()
                },
                {
                    name: "Roblox Username",
                    value: profile.roblox
                },
                {
                    name: "School / Organisation",
                    value:
                        profile.organisation ||
                        "Not provided"
                },
                {
                    name: "Position",
                    value:
                        profile.position ||
                        "Not provided"
                },
                {
                    name: "Status",
                    value:
                        profile.status
                },
                {
                    name: "RSA ID",
                    value:
                        profile.rsaId ||
                        "Not assigned"
                }
            ]
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* USER INFO */

    if (command === "userinfo") {

        const user =
            interaction.options.getUser("user") ||
            interaction.user;

        const member =
            await interaction.guild.members
                .fetch(user.id)
                .catch(() => null);

        const embed = createEmbed({
            title: "User Information",
            thumbnail:
                user.displayAvatarURL({
                    size: 256
                }),
            fields: [
                {
                    name: "Username",
                    value: user.tag
                },
                {
                    name: "User ID",
                    value: user.id
                },
                {
                    name: "Account Created",
                    value:
                        `<t:${Math.floor(
                            user.createdTimestamp / 1000
                        )}:F>`
                },
                {
                    name: "Joined Server",
                    value:
                        member
                            ? `<t:${Math.floor(
                                member.joinedTimestamp / 1000
                            )}:F>`
                            : "Not in server"
                }
            ]
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* SERVER INFO */

    if (command === "serverinfo") {

        const guild =
            interaction.guild;

        const embed = createEmbed({
            title: "Server Information",
            thumbnail:
                guild.iconURL({
                    size: 256
                }),
            fields: [
                {
                    name: "Server",
                    value: guild.name
                },
                {
                    name: "Members",
                    value:
                        `${guild.memberCount}`,
                    inline: true
                },
                {
                    name: "Channels",
                    value:
                        `${guild.channels.cache.size}`,
                    inline: true
                },
                {
                    name: "Roles",
                    value:
                        `${guild.roles.cache.size}`,
                    inline: true
                },
                {
                    name: "Owner",
                    value:
                        `<@${guild.ownerId}>`
                }
            ]
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* ROLE INFO */

    if (command === "roleinfo") {

        const role =
            interaction.options.getRole("role");

        const embed = createEmbed({
            title: "Role Information",
            fields: [
                {
                    name: "Role",
                    value: role.toString()
                },
                {
                    name: "Role ID",
                    value: role.id
                },
                {
                    name: "Position",
                    value:
                        `${role.position}`
                },
                {
                    name: "Members",
                    value:
                        `${role.members.size}`
                }
            ]
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* CHANNEL INFO */

    if (command === "channelinfo") {

        const channel =
            interaction.options.getChannel(
                "channel"
            ) ||
            interaction.channel;

        const embed = createEmbed({
            title: "Channel Information",
            fields: [
                {
                    name: "Channel",
                    value: channel.toString()
                },
                {
                    name: "Channel ID",
                    value: channel.id
                },
                {
                    name: "Type",
                    value:
                        channel.type === ChannelType.GuildText
                            ? "Text"
                            : "Other"
                },
                {
                    name: "Created",
                    value:
                        `<t:${Math.floor(
                            channel.createdTimestamp / 1000
                        )}:F>`
                }
            ]
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* AVATAR */

    if (command === "avatar") {

        const user =
            interaction.options.getUser("user") ||
            interaction.user;

        const avatar =
            user.displayAvatarURL({
                size: 1024,
                extension: "png"
            });

        const embed = createEmbed({
            title: "Avatar",
            description:
                `Avatar for **${user.tag}**`,
            image: avatar
        });

        return interaction.reply({
            embeds: [embed]
        });
    }

    /* POLL */

    if (command === "poll") {

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.ManageMessages
            )
        ) {
            return interaction.reply({
                content:
                    "You need the Manage Messages permission to create a poll.",
                ephemeral: true
            });
        }

        const question =
            interaction.options.getString(
                "question"
            );

        const options = [
            interaction.options.getString("option1"),
            interaction.options.getString("option2"),
            interaction.options.getString("option3"),
            interaction.options.getString("option4")
        ].filter(Boolean);

        const letters = [
            "A",
            "B",
            "C",
            "D"
        ];

        const description =
            options
                .map(
                    (option, index) =>
                        `**${letters[index]}.** ${option}`
                )
                .join("\n\n");

        const embed = createEmbed({
            title: "Poll",
            description:
                `**${question}**\n\n${description}`,
            footer:
                `Poll created by ${interaction.user.tag}`
        });

        const message =
            await interaction.channel.send({
                embeds: [embed]
            });

        const reactions = [
            "🇦",
            "🇧",
            "🇨",
            "🇩"
        ];

        for (
            let i = 0;
            i < options.length;
            i++
        ) {
            await message.react(
                reactions[i]
            ).catch(() => {});
        }

        return interaction.reply({
            content:
                "Poll created.",
            ephemeral: true
        });
    }

    /* REMIND */

    if (command === "remind") {

        const minutes =
            interaction.options.getInteger(
                "minutes"
            );

        const message =
            interaction.options.getString(
                "message"
            );

        const id =
            `${interaction.user.id}-${Date.now()}`;

        reminders[id] = {
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            message,
            due:
                Date.now() +
                minutes * 60 * 1000
        };

        saveData(
            REMINDERS_FILE,
            reminders
        );

        const embed = createEmbed({
            title: "Reminder Set",
            description:
                `I'll remind you in **${minutes} minutes**.\n\n${message}`
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* WELCOME CONFIG */

    if (
        command === "welcome-config"
    ) {

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.ManageGuild
            )
        ) {
            return interaction.reply({
                content:
                    "You need the Manage Server permission.",
                ephemeral: true
            });
        }

        return showWelcomeConfig(
            interaction
        );
    }
}

/* =========================================================
   WELCOME CONFIGURATION
========================================================= */

function getGuildConfig(guildId) {

    if (!configs[guildId]) {
        configs[guildId] = {
            welcome: {
                enabled: false,
                channelId: null,
                message:
                    "Welcome to the Roblox Schools Association, {user}! Please take a look around and complete your RSA enrolment using `/enrol`."
            }
        };

        saveData(
            CONFIG_FILE,
            configs
        );
    }

    if (!configs[guildId].welcome) {
        configs[guildId].welcome = {
            enabled: false,
            channelId: null,
            message:
                "Welcome to the Roblox Schools Association, {user}! Please take a look around and complete your RSA enrolment using `/enrol`."
        };
    }

    return configs[guildId];
}

async function showWelcomeConfig(
    interaction
) {

    const config =
        getGuildConfig(
            interaction.guild.id
        );

    const welcome =
        config.welcome;

    const status =
        welcome.enabled
            ? "Enabled"
            : "Disabled";

    const channel =
        welcome.channelId
            ? `<#${welcome.channelId}>`
            : "Not configured";

    const embed = createEmbed({
        title: "Welcomer Configuration",
        description:
            "Configure the automatic RSA welcome system.",
        fields: [
            {
                name: "Status",
                value: status,
                inline: true
            },
            {
                name: "Channel",
                value: channel,
                inline: true
            },
            {
                name: "Message",
                value:
                    welcome.message.slice(
                        0,
                        1000
                    )
            }
        ]
    });

    const row1 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        "welcome_enable"
                    )
                    .setLabel("Enable")
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        "welcome_disable"
                    )
                    .setLabel("Disable")
                    .setStyle(
                        ButtonStyle.Danger
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        "welcome_channel"
                    )
                    .setLabel("Set Channel")
                    .setStyle(
                        ButtonStyle.Primary
                    )
            );

    const row2 =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        "welcome_message"
                    )
                    .setLabel("Edit Message")
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        "welcome_preview"
                    )
                    .setLabel("Preview")
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        "welcome_reset"
                    )
                    .setLabel("Reset")
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            );

    const payload = {
        embeds: [embed],
        components: [
            row1,
            row2
        ],
        ephemeral: true
    };

    if (
        interaction.replied ||
        interaction.deferred
    ) {
        return interaction.editReply(
            payload
        );
    }

    return interaction.reply(
        payload
    );
}

/* =========================================================
   BUTTON HANDLER
========================================================= */

async function handleButton(
    interaction
) {

    if (
        !interaction.customId.startsWith(
            "welcome_"
        )
    ) {
        return;
    }

    if (
        !interaction.member.permissions.has(
            PermissionsBitField.Flags.ManageGuild
        )
    ) {
        return interaction.reply({
            content:
                "You need the Manage Server permission.",
            ephemeral: true
        });
    }

    const config =
        getGuildConfig(
            interaction.guild.id
        );

    if (
        interaction.customId ===
        "welcome_enable"
    ) {

        if (!config.welcome.channelId) {
            return interaction.reply({
                content:
                    "Set a welcome channel before enabling the welcomer.",
                ephemeral: true
            });
        }

        config.welcome.enabled = true;

        saveData(
            CONFIG_FILE,
            configs
        );

        await interaction.reply({
            content:
                "The RSA welcomer has been enabled.",
            ephemeral: true
        });

        return;
    }

    if (
        interaction.customId ===
        "welcome_disable"
    ) {

        config.welcome.enabled = false;

        saveData(
            CONFIG_FILE,
            configs
        );

        await interaction.reply({
            content:
                "The RSA welcomer has been disabled.",
            ephemeral: true
        });

        return;
    }

    if (
        interaction.customId ===
        "welcome_channel"
    ) {

        const modal =
            new ModalBuilder()
                .setCustomId(
                    "welcome_channel_modal"
                )
                .setTitle(
                    "Set Welcome Channel"
                );

        const input =
            new TextInputBuilder()
                .setCustomId(
                    "channel_id"
                )
                .setLabel(
                    "Channel ID"
                )
                .setPlaceholder(
                    "Enter the channel ID"
                )
                .setStyle(
                    TextInputStyle.Short
                )
                .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder()
                .addComponents(input)
        );

        return interaction.showModal(
            modal
        );
    }

    if (
        interaction.customId ===
        "welcome_message"
    ) {

        const modal =
            new ModalBuilder()
                .setCustomId(
                    "welcome_message_modal"
                )
                .setTitle(
                    "Edit Welcome Message"
                );

        const input =
            new TextInputBuilder()
                .setCustomId(
                    "message"
                )
                .setLabel(
                    "Welcome Message"
                )
                .setPlaceholder(
                    "Use {user} to mention the member."
                )
                .setStyle(
                    TextInputStyle.Paragraph
                )
                .setRequired(true)
                .setMaxLength(2000)
                .setValue(
                    config.welcome.message
                );

        modal.addComponents(
            new ActionRowBuilder()
                .addComponents(input)
        );

        return interaction.showModal(
            modal
        );
    }

    if (
        interaction.customId ===
        "welcome_preview"
    ) {

        const message =
            config.welcome.message
                .replace(
                    "{user}",
                    interaction.user.toString()
                );

        const embed = createEmbed({
            title:
                "Welcome to the Roblox Schools Association",
            description:
                message
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    if (
        interaction.customId ===
        "welcome_reset"
    ) {

        config.welcome = {
            enabled: false,
            channelId: null,
            message:
                "Welcome to the Roblox Schools Association, {user}! Please take a look around and complete your RSA enrolment using `/enrol`."
        };

        saveData(
            CONFIG_FILE,
            configs
        );

        return interaction.reply({
            content:
                "The welcome configuration has been reset.",
            ephemeral: true
        });
    }
}

/* =========================================================
   MODAL HANDLER
========================================================= */

async function handleModal(
    interaction
) {

    /* ENROLMENT */

    if (
        interaction.customId ===
        "enrol_modal"
    ) {

        const roblox =
            interaction.fields.getTextInputValue(
                "roblox"
            );

        const organisation =
            interaction.fields.getTextInputValue(
                "organisation"
            );

        const position =
            interaction.fields.getTextInputValue(
                "position"
            );

        const reason =
            interaction.fields.getTextInputValue(
                "reason"
            );

        const rsaId =
            `RSA-${String(
                Object.keys(profiles).length + 1
            ).padStart(4, "0")}`;

        profiles[
            interaction.user.id
        ] = {
            discordId:
                interaction.user.id,

            discordTag:
                interaction.user.tag,

            roblox,

            organisation,

            position,

            reason,

            rsaId,

            status:
                "pending",

            submitted:
                Date.now()
        };

        saveData(
            PROFILES_FILE,
            profiles
        );

        const config =
            getGuildConfig(
                interaction.guild.id
            );

        const reviewChannelId =
            config.enrolmentReviewChannel;

        if (reviewChannelId) {

            const reviewChannel =
                interaction.guild.channels.cache.get(
                    reviewChannelId
                );

            if (reviewChannel) {

                const embed = createEmbed({
                    title:
                        "New RSA Enrolment",
                    description:
                        `A new RSA enrolment has been submitted by ${interaction.user}.`,
                    fields: [
                        {
                            name: "RSA ID",
                            value: rsaId
                        },
                        {
                            name: "Roblox Username",
                            value: roblox
                        },
                        {
                            name:
                                "School / Organisation",
                            value:
                                organisation ||
                                "Not provided"
                        },
                        {
                            name: "Position",
                            value:
                                position ||
                                "Not provided"
                        },
                        {
                            name: "Reason",
                            value:
                                reason
                        }
                    ]
                });

                const buttons =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId(
                                    `enrol_approve_${interaction.user.id}`
                                )
                                .setLabel(
                                    "Approve"
                                )
                                .setStyle(
                                    ButtonStyle.Success
                                ),

                            new ButtonBuilder()
                                .setCustomId(
                                    `enrol_reject_${interaction.user.id}`
                                )
                                .setLabel(
                                    "Reject"
                                )
                                .setStyle(
                                    ButtonStyle.Danger
                                )
                        );

                await reviewChannel.send({
                    embeds: [embed],
                    components: [
                        buttons
                    ]
                });
            }
        }

        const embed = createEmbed({
            title:
                "Enrolment Submitted",
            description:
                "Your RSA enrolment has been submitted successfully.",
            fields: [
                {
                    name: "RSA ID",
                    value: rsaId
                },
                {
                    name: "Status",
                    value: "Pending Review"
                }
            ]
        });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* WELCOME CHANNEL */

    if (
        interaction.customId ===
        "welcome_channel_modal"
    ) {

        const channelId =
            interaction.fields.getTextInputValue(
                "channel_id"
            );

        const channel =
            interaction.guild.channels.cache.get(
                channelId
            );

        if (
            !channel ||
            channel.type !==
            ChannelType.GuildText
        ) {
            return interaction.reply({
                content:
                    "That isn't a valid text channel in this server.",
                ephemeral: true
            });
        }

        const config =
            getGuildConfig(
                interaction.guild.id
            );

        config.welcome.channelId =
            channel.id;

        saveData(
            CONFIG_FILE,
            configs
        );

        return interaction.reply({
            content:
                `Welcome messages will now be sent in ${channel}.`,
            ephemeral: true
        });
    }

    /* WELCOME MESSAGE */

    if (
        interaction.customId ===
        "welcome_message_modal"
    ) {

        const message =
            interaction.fields.getTextInputValue(
                "message"
            );

        const config =
            getGuildConfig(
                interaction.guild.id
            );

        config.welcome.message =
            message;

        saveData(
            CONFIG_FILE,
            configs
        );

        return interaction.reply({
            content:
                "The welcome message has been updated.",
            ephemeral: true
        });
    }
}

/* =========================================================
   MEMBER JOIN
========================================================= */

client.on(
    "guildMemberAdd",
    async member => {

        const config =
            getGuildConfig(
                member.guild.id
            );

        const welcome =
            config.welcome;

        if (
            !welcome.enabled ||
            !welcome.channelId
        ) {
            return;
        }

        const channel =
            member.guild.channels.cache.get(
                welcome.channelId
            );

        if (!channel) {
            return;
        }

        const message =
            welcome.message.replace(
                "{user}",
                member.toString()
            );

        const embed = createEmbed({
            title:
                "Welcome to the Roblox Schools Association",
            description:
                message,
            thumbnail:
                member.user.displayAvatarURL({
                    size: 256
                })
        });

        await channel.send({
            content:
                member.toString(),
            embeds: [embed]
        }).catch(() => {});
    }
);

/* =========================================================
   REMINDER SYSTEM
========================================================= */

function startReminderSystem() {

    setInterval(
        async () => {

            const now =
                Date.now();

            for (
                const id of Object.keys(
                    reminders
                )
            ) {

                const reminder =
                    reminders[id];

                if (
                    reminder.due > now
                ) {
                    continue;
                }

                const channel =
                    client.channels.cache.get(
                        reminder.channelId
                    );

                if (channel) {

                    const embed =
                        createEmbed({
                            title:
                                "Reminder",
                            description:
                                `<@${reminder.userId}>\n\n${reminder.message}`
                        });

                    await channel.send({
                        embeds: [embed]
                    }).catch(() => {});
                }

                delete reminders[id];
            }

            saveData(
                REMINDERS_FILE,
                reminders
            );

        },
        10 * 1000
    );
}

/* =========================================================
   ERROR HANDLING
========================================================= */

client.on(
    "error",
    error => {
        console.error(
            "Discord client error:",
            error
        );
    }
);

process.on(
    "unhandledRejection",
    error => {
        console.error(
            "Unhandled promise rejection:",
            error
        );
    }
);

/* =========================================================
   LOGIN
========================================================= */

client.login(TOKEN);
