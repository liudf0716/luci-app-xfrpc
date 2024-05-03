# luci-app-xfrpc
luci for xfrpc

## how to use in OpenWRT

```
git clone https://github.com/openwrt/luci.git
git clone https://github.com/liudf0716/luci-app-xfrpc.git
# replace luci-app-xfrpc
rm -rf luci/applications/luci-app-xfrpc
cp -r luci-app-xfrpc luci/applications

git clone https://github.com/openwrt/openwrt.git
```

```
./scripts/feeds update -a
./scripts/feeds install -a
```

`make menuconfig` and `luci ---> Applictions ---> luci-app-xfrpc` 

```
make package/luci-app-xfrpc/compile
```

or

```
make V=s
```

## demo

### common configure

![image](https://user-images.githubusercontent.com/1182593/173511270-d1fb8c1d-f82c-4258-8585-2e9b0736857f.png)

### init configure

![image](https://user-images.githubusercontent.com/1182593/173511497-c4479f94-6b9c-4858-bf82-abbc57195afe.png)

### tcp proxy configure

![image](https://user-images.githubusercontent.com/1182593/173511673-cfd5b6dd-b4f9-47d4-a1ba-67d57c55f89a.png)

### http&https proxy configure

![image](https://user-images.githubusercontent.com/1182593/173511745-7e0929de-80b3-402e-a588-abab905ca085.png)
