import 'dart:async';
import 'package:signalr_netcore/signalr_client.dart';
import 'api_config.dart';
import 'auth_service.dart';

/// Events emitted by SignalR that the UI can react to.
enum SignalREvent {
  requestUpdated,
  newRequest,
  announcementCreated,
  announcementUpdated,
  documentTypeCreated,
  documentTypeUpdated,
  requirementUpdated,
}

class SignalRMessage {
  final SignalREvent event;
  final Map<String, dynamic> data;
  const SignalRMessage(this.event, this.data);
}

class SignalRService {
  SignalRService._();
  static final SignalRService instance = SignalRService._();

  HubConnection? _connection;
  StreamController<SignalRMessage> _controller = StreamController<SignalRMessage>.broadcast();
  bool _isConnecting = false;

  /// Listen to all real-time events from the hub.
  Stream<SignalRMessage> get stream => _controller.stream;

  bool get isConnected =>
      _connection?.state == HubConnectionState.Connected;

  Future<void> connect() async {
    if (isConnected || _isConnecting) return;
    _isConnecting = true;

    final token = await AuthService.getToken();
    if (token == null) {
      _isConnecting = false;
      return;
    }

    // Re-open controller if it was closed (e.g. after dispose)
    if (_controller.isClosed) {
      _controller = StreamController<SignalRMessage>.broadcast();
    }

    final hubUrl = '${ApiConfig.baseUrl2}/hubs/requests?access_token=$token';

    _connection = HubConnectionBuilder()
        .withUrl(
          hubUrl,
          options: HttpConnectionOptions(
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true,
          ),
        )
        .withAutomaticReconnect()
        .build();

    _registerHandlers();

    try {
      await _connection!.start();
    } catch (e) {
      // Connection failed — will retry via automatic reconnect
    } finally {
      _isConnecting = false;
    }
  }

  void _registerHandlers() {
    final c = _connection!;

    c.on('RequestUpdated', (args) => _emit(SignalREvent.requestUpdated, args));
    c.on('NewRequest', (args) => _emit(SignalREvent.newRequest, args));
    c.on('AnnouncementCreated', (args) => _emit(SignalREvent.announcementCreated, args));
    c.on('AnnouncementUpdated', (args) => _emit(SignalREvent.announcementUpdated, args));
    c.on('DocumentTypeCreated', (args) => _emit(SignalREvent.documentTypeCreated, args));
    c.on('DocumentTypeUpdated', (args) => _emit(SignalREvent.documentTypeUpdated, args));
    c.on('RequirementUpdated', (args) => _emit(SignalREvent.requirementUpdated, args));
  }

  void _emit(SignalREvent event, List<Object?>? args) {
    if (_controller.isClosed) return;
    final data = (args != null && args.isNotEmpty && args[0] is Map)
        ? Map<String, dynamic>.from(args[0] as Map)
        : <String, dynamic>{};
    _controller.add(SignalRMessage(event, data));
  }

  Future<void> disconnect() async {
    await _connection?.stop();
    _connection = null;
  }

  void dispose() {
    disconnect();
    _controller.close();
  }
}
