package SLJbot;

import java.util.List;

import de.btobastian.javacord.entities.message.Message;
import SLJbot.formats.CommandAnswer;

public interface JediStarBotCommand {
	
	public String getCommand();

	public CommandAnswer answer(List<String> params, Message receivedMessage, boolean isAdmin);
}
