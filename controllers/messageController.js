const Message = require('../models/message');
const Channel = require('../models/channel');
const Group = require('../models/group');

exports.getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const messages = await Message.find({ channel: channelId }).populate('sender', 'username');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;

    const channel = await Channel.findById(channelId).populate('group');
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const group = channel.group;
    if (!(req.user.role === 'superadmin' ||
          group.admins.includes(req.user._id) ||
          group.members.includes(req.user._id))) {
      return res.status(403).json({ error: 'No permission' });
    }

    const message = await Message.create({
      content,
      sender: req.user._id,
      channel: channel._id
    });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
