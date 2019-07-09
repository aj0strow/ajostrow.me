If you're using [elastic](https://www.elastic.co/) to handle log aggregation and [systemd](https://wiki.debian.org/systemd) to manage processes, there's a quick way to export logs using [journalbeat](https://www.elastic.co/guide/en/beats/journalbeat/current/index.html). 

### Install Journal Beat

Check the `journalbeat` install guide. At the time of writing, you can `curl` and `dpkg` the latest release for debian. It installs a unit file for `systemd` so reload the deamon. 

```sh
sudo systemctl daemon-reload
```

### Edit YAML File

The minimum viable config is to update the inputs and outputs. 

```yaml
# /etc/journalbeat/journalbeat.yml

journalbeat.inputs:
  - paths:
      - "/run/log/journal"
    include_matches:
      - "systemd.unit=app.service"

output.elasticsearch:
  hosts: 
    - "elastic.host:9200"

```

Breaking it down:

* Check where `systemd` stores journal files. In my case for debian it was the `/run/log/journal` directory. It could be a different directory for different operating systems. 

* Change `app.service` to the name of your `systemd` unit file. It won't work if you omit the `.service` extension like `"systemd.unit=app"` it has to be the full `"systemd.unit=app.service"`.

* Change `elastic.host:9200` to your actual ElasticSearch host. 

Check the `journalbeat` service logs. If you don't pipe the output through a pager like `less` it will not wrap lines and all you see is the timestamp and the start of the log message.

```sh
journalctl -u journalbeat -xn | less
```

It should tell you when it pushes logs to `elastic`.

```
INFO        [input]        input/input.go:135        journalbeat successfully published 4 events        {"id": "86667999-0253-4496-b488-d4451bed529e"}
```

### Kibana

In the Kibana dashboard include the index pattern `journalbeat-*`. It automatically includes a ton of metadata but you can pick what is helpful to display in the Kibana index settings. 
